"use client";

import Image from "next/image";
import { useState } from "react";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { BlockAction, TableActions, ViewAction } from "@/components/table-actions";
import { FilterTabs, Toolbar, TypeChip } from "@/components/ui";
import { prettyDate } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import { asList, useBlockUserMutation, useGetUsersQuery } from "@/store/api";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [blockUser] = useBlockUserMutation();

  const status =
    statusFilter === "active" || statusFilter === "blocked" ? statusFilter : undefined;
  const role = roleFilter === "retail" || roleFilter === "wholesale" ? roleFilter : undefined;

  const listParams = {
    page,
    limit: 10,
    searchTerm: searchTerm || undefined,
    status,
    role,
  };

  const { data } = useGetUsersQuery(listParams);
  const all = useGetUsersQuery({ page: 1, limit: 1, role });
  const active = useGetUsersQuery({ page: 1, limit: 1, status: "active", role });
  const blocked = useGetUsersQuery({ page: 1, limit: 1, status: "blocked", role });
  const allRoles = useGetUsersQuery({ page: 1, limit: 1, status });
  const retail = useGetUsersQuery({ page: 1, limit: 1, status, role: "retail" });
  const wholesale = useGetUsersQuery({ page: 1, limit: 1, status, role: "wholesale" });
  const list = asList<AdminUser>(data?.data);

  return (
    <div>
      <PageHeader title="User Management" />
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            items={[
              { id: "all", label: "All", count: asList(all.data?.data).total },
              { id: "active", label: "Active", count: asList(active.data?.data).total },
              {
                id: "blocked",
                label: "Suspended",
                count: asList(blocked.data?.data).total,
              },
            ]}
          />
          <Toolbar
            search={searchTerm}
            onSearch={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            placeholder="Search name, email, phone..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Role</p>
          <FilterTabs
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            items={[
              { id: "all", label: "All Roles", count: asList(allRoles.data?.data).total },
              { id: "retail", label: "Retail", count: asList(retail.data?.data).total },
              {
                id: "wholesale",
                label: "Wholesale",
                count: asList(wholesale.data?.data).total,
              },
            ]}
          />
        </div>
      </div>
      <TableCard footer={<Pagination page={page} total={list.total} limit={10} onPage={setPage} />}>
        <Table>
          <THead columns={["User", "Email", "Phone", "Role", "Status", "Join Date", "Actions"]} />
          <tbody>
            {list.items.map((user) => {
              const nextStatus = user.status === "blocked" ? "active" : "blocked";
              return (
                <tr key={user.id} className="border-t border-line-soft">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={user.profile || "/images/avatar-profile.png"}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover"
                      />
                      <span className="font-semibold text-ink">{user.name || "Customer"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate">{user.email}</td>
                  <td className="px-6 py-4 text-slate">{user.phoneNumber || "—"}</td>
                  <td className="px-6 py-4">
                    <TypeChip value={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill value={user.status} />
                  </td>
                  <td className="px-6 py-4">{prettyDate(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <TableActions>
                      <ViewAction href={`/customers/${user.id}`} />
                      <BlockAction
                        blocked={user.status === "blocked"}
                        onClick={() => blockUser({ id: user.id, status: nextStatus })}
                      />
                    </TableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
