"use client";

import { useMemo, useState } from "react";
import { FaqForm } from "@/components/faq-form";
import { Pagination, Table, TableCard, THead } from "@/components/data-table";
import { IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { DeleteAction, EditAction, TableActions } from "@/components/table-actions";
import { Modal, Toolbar, TypeChip } from "@/components/ui";
import { prettyDate } from "@/lib/format";
import type { FaqRecord } from "@/lib/types";
import { asList, useDeleteFaqMutation, useGetFaqsQuery } from "@/store/api";

export default function FaqsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [remove] = useDeleteFaqMutation();
  const { data, isLoading } = useGetFaqsQuery({
    page: 1,
    limit: 100,
    searchTerm: search || undefined,
  });
  const list = asList<FaqRecord>(data?.data);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list.items;
    return list.items.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.category?.name?.toLowerCase().includes(term),
    );
  }, [list.items, search]);

  const limit = 8;
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <PageHeader
        title="FAQ Management"
        description="Create and manage frequently asked questions for customers."
      />
      <Toolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search question or answer..."
      >
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          <IconPlus className="size-4" />
          Add FAQ
        </button>
      </Toolbar>

      <TableCard
        footer={
          <Pagination page={page} total={filtered.length} limit={limit} onPage={setPage} />
        }
      >
        <Table>
          <THead columns={["Question", "Answer", "Category", "Created", "Actions"]} />
          <tbody>
            {pageItems.map((faq) => (
              <tr key={faq.id} className="border-t border-line-soft">
                <td className="px-6 py-4">
                  <p className="max-w-xs font-semibold text-ink">{faq.question}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-sm truncate text-sm text-slate">{faq.answer}</p>
                </td>
                <td className="px-6 py-4">
                  <TypeChip value={faq.category?.name || "General"} />
                </td>
                <td className="px-6 py-4 text-slate">{prettyDate(faq.createdAt)}</td>
                <td className="px-6 py-4">
                  <TableActions>
                    <EditAction onClick={() => setEditId(faq.id)} />
                    <DeleteAction onClick={() => remove(faq.id)} />
                  </TableActions>
                </td>
              </tr>
            ))}
            {!isLoading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted">
                  No FAQs yet. Add your first question.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add FAQ"
        description="Write a question and answer customers will see on the storefront."
      >
        <FaqForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Edit FAQ"
        description="Update the question, answer, or category."
      >
        {editId ? <FaqForm id={editId} onDone={() => setEditId(null)} /> : null}
      </Modal>
    </div>
  );
}
