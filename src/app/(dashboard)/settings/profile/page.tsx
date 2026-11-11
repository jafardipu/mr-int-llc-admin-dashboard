"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { mediaUrl } from "@/lib/format";
import { useChangePasswordMutation, useGetMyProfileQuery, useUpdateMyProfileMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading profile…</div>}>
      <ProfileSettingsContent />
    </Suspense>
  );
}

function ProfileSettingsContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const { data } = useGetMyProfileQuery();
  const [updateProfile, profileState] = useUpdateMyProfileMutation();
  const [changePassword, passwordState] = useChangePasswordMutation();
  const user = data?.data;
  const [tab, setTab] = useState<"profile" | "password">(
    searchParams.get("tab") === "password" ? "password" : "profile",
  );
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
  }, [user]);

  useEffect(() => {
    setTab(searchParams.get("tab") === "password" ? "password" : "profile");
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function onPickImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  async function onSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      let result;
      if (avatarFile) {
        const body = new FormData();
        body.append("data", JSON.stringify({ name, phoneNumber }));
        body.append("profile", avatarFile);
        result = await updateProfile(body).unwrap();
      } else {
        result = await updateProfile({ name, phoneNumber }).unwrap();
      }
      if (token && result.data) {
        dispatch(setCredentials({ accessToken: token, user: result.data }));
      }
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview("");
      setMessage("Profile updated");
    } catch (err) {
      const next =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Profile update failed")
          : "Profile update failed";
      setError(next);
    }
  }

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await changePassword(passwords).unwrap();
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password changed");
    } catch (err) {
      const next =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Password update failed")
          : "Password update failed";
      setError(next);
    }
  }

  const previewSrc = avatarPreview || mediaUrl(user?.profile);

  return (
    <div>
      <PageHeader title="Profile Manage" description="Manage your Profile" />
      <div className="mb-6 flex gap-6 border-b border-line-soft text-sm">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={`pb-3 ${tab === "profile" ? "border-b-2 border-ink font-semibold text-ink" : "text-muted"}`}
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`pb-3 ${tab === "password" ? "border-b-2 border-ink font-semibold text-ink" : "text-muted"}`}
        >
          Change Password
        </button>
      </div>
      {message ? <p className="mb-4 text-sm text-success">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {tab === "profile" ? (
        <form onSubmit={onSaveProfile} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={previewSrc}
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-full object-cover"
              unoptimized
            />
            <div>
              <p className="text-lg font-bold">{user?.name || "Admin"}</p>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onPickImage(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="ml-auto rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              {avatarFile ? "Change Image" : "Upload Image"}
            </button>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-label">Full Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-full border border-line bg-input px-4" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-label">Email Address</span>
            <input value={user?.email ?? ""} disabled className="h-12 w-full rounded-full border border-line bg-[#f3eee6] px-4 text-muted" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-label">Phone Number</span>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-12 w-full rounded-full border border-line bg-input px-4" />
          </label>
          <button type="submit" disabled={profileState.isLoading} className="h-12 w-full rounded-full bg-brand text-sm font-semibold text-white">
            Save
          </button>
        </form>
      ) : (
        <form onSubmit={onChangePassword} className="space-y-5">
          <input
            type="password"
            placeholder="Old password"
            value={passwords.oldPassword}
            onChange={(e) => setPasswords((c) => ({ ...c, oldPassword: e.target.value }))}
            className="h-12 w-full rounded-full border border-line bg-input px-4"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((c) => ({ ...c, newPassword: e.target.value }))}
            className="h-12 w-full rounded-full border border-line bg-input px-4"
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((c) => ({ ...c, confirmPassword: e.target.value }))}
            className="h-12 w-full rounded-full border border-line bg-input px-4"
            required
          />
          <button type="submit" disabled={passwordState.isLoading} className="h-12 w-full rounded-full bg-brand text-sm font-semibold text-white">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
