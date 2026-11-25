"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDeleteAction } from "@/components/confirm-delete-action";
import { Table, TableCard, THead } from "@/components/data-table";
import { FaqForm } from "@/components/faq-form";
import { IconChevron, IconGrip, IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { EditAction, TableActions } from "@/components/table-actions";
import { toast } from "@/components/toast";
import { Modal, Toolbar } from "@/components/ui";
import { apiErrorMessage } from "@/lib/api-error";
import { prettyDate } from "@/lib/format";
import type { FaqRecord } from "@/lib/types";
import { asList, useDeleteFaqMutation, useGetFaqsQuery, useReorderFaqsMutation } from "@/store/api";

const COLUMNS = ["Position", "Question", "Answer", "Last updated", "Actions"];

/** Rows only move up and down. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export default function FaqsPage() {
  // Every FAQ is loaded at once (reordering needs the full list). Raised if the server has more.
  const [limit, setLimit] = useState(500);
  const { data, isLoading, isFetching, error, refetch } = useGetFaqsQuery({ limit });
  const [reorder, reorderState] = useReorderFaqsMutation();
  const [remove] = useDeleteFaqMutation();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRecord | null>(null);

  const list = asList<FaqRecord>(data?.data);
  const faqs = list.items; // already sorted by `order` on the server
  useEffect(() => {
    if (list.total > faqs.length && list.total > limit) setLimit(list.total);
  }, [list.total, faqs.length, limit]);

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      term
        ? faqs.filter((faq) => faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term))
        : faqs,
    [faqs, term],
  );
  // Position shown to the admin = place in the full list, not the raw `order` (which has gaps).
  const positions = useMemo(() => new Map(faqs.map((faq, index) => [faq.id, index + 1])), [faqs]);
  const searching = term !== "";
  const locked = searching || reorderState.isLoading || isFetching;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function saveOrder(next: FaqRecord[]) {
    try {
      await reorder(next.map((faq) => faq.id)).unwrap();
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save the new order");
      toast.error(`${/[.!?]$/.test(message) ? message : `${message}.`} The list has been reloaded, so please make the move again.`);
    }
  }

  function moveBy(faq: FaqRecord, delta: -1 | 1) {
    const from = faqs.findIndex((item) => item.id === faq.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= faqs.length) return;
    void saveOrder(arrayMove(faqs, from, to));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = faqs.findIndex((faq) => faq.id === active.id);
    const to = faqs.findIndex((faq) => faq.id === over.id);
    if (from < 0 || to < 0) return;
    void saveOrder(arrayMove(faqs, from, to));
  }

  async function handleDelete(faq: FaqRecord) {
    try {
      const result = await remove(faq.id).unwrap();
      toast.success(result.message || "FAQ deleted.");
    } catch (err) {
      // The list refetches on its own (the mutation invalidates "Faqs" on failure too).
      toast.error(apiErrorMessage(err, "Could not delete the FAQ. Please try again."));
    }
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setCreateOpen(true)}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
    >
      <IconPlus className="size-4" />
      Add FAQ
    </button>
  );

  return (
    <div>
      <PageHeader
        title="FAQ Management"
        description={
          data
            ? `${faqs.length} ${faqs.length === 1 ? "FAQ" : "FAQs"} · Customers see them in this order. Drag a row or use the arrows to change it.`
            : "Questions and answers shown to customers on the storefront."
        }
        action={addButton}
      />

      {error && !data ? (
        <section className="rounded-2xl bg-white px-6 py-12 text-center">
          <p className="text-sm text-danger">{apiErrorMessage(error, "Could not load the FAQs.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand"
          >
            Retry
          </button>
        </section>
      ) : !isLoading && faqs.length === 0 ? (
        <section className="rounded-2xl bg-white px-6 py-14 text-center">
          <p className="text-lg font-bold text-ink">No FAQs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Add the questions customers ask most. They appear on the storefront FAQ page in the order you set here.
          </p>
          <div className="mt-5 flex justify-center">{addButton}</div>
        </section>
      ) : (
        <>
          <Toolbar search={search} onSearch={setSearch} placeholder="Search question or answer..." />
          {error ? (
            <p className="mb-3 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning">
              Could not refresh the FAQ list. Showing the last loaded version.{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold underline">
                Retry
              </button>
            </p>
          ) : null}
          {searching ? (
            <p className="-mt-1 mb-3 px-1 text-xs text-muted">
              Showing {visible.length} of {faqs.length}. Clear search to reorder.
            </p>
          ) : null}

          <TableCard>
            <DndContext
              id="faq-order"
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[verticalOnly]}
              onDragEnd={onDragEnd}
            >
              <Table>
                <THead columns={COLUMNS} />
                <tbody>
                  {isLoading ? (
                    <SkeletonRows />
                  ) : (
                    <SortableContext
                      items={visible.map((faq) => faq.id)}
                      strategy={verticalListSortingStrategy}
                      disabled={locked}
                    >
                      {visible.map((faq) => {
                        const position = positions.get(faq.id) ?? 0;
                        return (
                          <FaqRow
                            key={faq.id}
                            faq={faq}
                            position={position}
                            locked={locked}
                            isFirst={position === 1}
                            isLast={position === faqs.length}
                            onMove={(delta) => moveBy(faq, delta)}
                            onEdit={() => setEditing(faq)}
                            onDelete={() => handleDelete(faq)}
                          />
                        );
                      })}
                      {visible.length === 0 ? (
                        <tr>
                          <td colSpan={COLUMNS.length} className="px-6 py-10 text-center text-sm text-muted">
                            No FAQs match &ldquo;{search.trim()}&rdquo;.
                          </td>
                        </tr>
                      ) : null}
                    </SortableContext>
                  )}
                </tbody>
              </Table>
            </DndContext>
          </TableCard>
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add FAQ"
        description="It's added at the end of the list. You can move it afterwards."
      >
        <FaqForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit FAQ"
        description="Change the question or answer. Its position stays the same."
      >
        {editing ? <FaqForm key={editing.id} faq={editing} onDone={() => setEditing(null)} /> : null}
      </Modal>
    </div>
  );
}

function FaqRow({
  faq,
  position,
  locked,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
}: {
  faq: FaqRecord;
  position: number;
  locked: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
    disabled: locked,
  });
  const moveClass =
    "inline-flex size-7 items-center justify-center rounded-full text-slate transition hover:bg-page hover:text-brand disabled:pointer-events-none disabled:opacity-30";

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        position: isDragging ? "relative" : undefined,
        zIndex: isDragging ? 1 : undefined,
      }}
      className={`border-t border-line-soft bg-white ${isDragging ? "shadow-lg" : ""}`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            disabled={locked}
            aria-label={`Drag to reorder: ${faq.question}`}
            title={locked ? undefined : "Drag to reorder"}
            className={`inline-flex size-8 touch-none items-center justify-center rounded-lg text-muted transition hover:bg-page hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <IconGrip className="size-4" />
          </button>
          <span className="w-7 text-center font-semibold text-ink">{position}</span>
          <span className="flex flex-col">
            <button
              type="button"
              aria-label={`Move up: ${faq.question}`}
              title="Move up"
              disabled={locked || isFirst}
              onClick={() => onMove(-1)}
              className={moveClass}
            >
              <IconChevron className="size-3.5 -rotate-90" />
            </button>
            <button
              type="button"
              aria-label={`Move down: ${faq.question}`}
              title="Move down"
              disabled={locked || isLast}
              onClick={() => onMove(1)}
              className={moveClass}
            >
              <IconChevron className="size-3.5 rotate-90" />
            </button>
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="max-w-xs font-semibold text-ink">{faq.question}</p>
      </td>
      <td className="px-6 py-4">
        {/* Plain text: React escapes it, and pre-line keeps the admin's line breaks. */}
        <p className="line-clamp-2 max-w-md whitespace-pre-line text-sm text-slate">{faq.answer}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-slate">{prettyDate(faq.updatedAt ?? faq.createdAt)}</td>
      <td className="px-6 py-4">
        <TableActions>
          <EditAction onClick={onEdit} />
          <ConfirmDeleteAction
            title="Delete this FAQ?"
            description={
              <span className="block max-w-xs">
                <span className="line-clamp-3 font-medium text-ink">&ldquo;{faq.question}&rdquo;</span>
                <span className="mt-1 block">It will be deleted permanently. This can&apos;t be undone.</span>
              </span>
            }
            onConfirm={onDelete}
          />
        </TableActions>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <tr key={index} className="border-t border-line-soft" aria-hidden>
          {COLUMNS.map((column) => (
            <td key={column} className="px-6 py-5">
              <span className="block h-3.5 w-full max-w-40 animate-pulse rounded-full bg-line-soft" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
