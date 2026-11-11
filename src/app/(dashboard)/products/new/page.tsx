import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";
import { BackLink } from "@/components/ui";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="Add Product"
        back={<BackLink href="/products">Back to Product List</BackLink>}
        description="Key info to describe and display your product."
      />
      <ProductForm />
    </div>
  );
}
