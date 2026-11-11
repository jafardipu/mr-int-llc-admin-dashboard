"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";
import { BackLink } from "@/components/ui";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader
        title="Product Details"
        back={<BackLink href={`/products/${params.id}`}>Back to Product Details</BackLink>}
        description="Key info to describe and display your product."
      />
      <ProductForm id={params.id} />
    </div>
  );
}
