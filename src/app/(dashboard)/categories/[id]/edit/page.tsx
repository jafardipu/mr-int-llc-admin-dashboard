"use client";

import { useParams } from "next/navigation";
import { CategoryForm } from "@/components/category-form";
import { PageHeader } from "@/components/page-header";
import { BackLink } from "@/components/ui";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader
        title="Edit Category"
        back={<BackLink href={`/categories/${params.id}`}>Back to Category Details</BackLink>}
        description="Update category image, name, and catalog visibility."
      />
      <CategoryForm id={params.id} />
    </div>
  );
}
