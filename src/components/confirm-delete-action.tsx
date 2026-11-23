"use client";

import { ConfigProvider, Popconfirm } from "antd";
import type { ReactNode } from "react";
import { IconTrash } from "./icons";
import { actionClass } from "./table-actions";

const confirmTheme = {
  token: {
    colorPrimary: "#995618",
    colorError: "#e11d48",
    borderRadius: 12,
    fontFamily: "inherit",
  },
};

/**
 * Table delete button that asks in an antd Popconfirm first. Kept out of table-actions.tsx so
 * only pages that use it load antd. `onConfirm` may return a promise: the Delete button shows a
 * spinner until it settles. Handle errors inside `onConfirm` so it always resolves.
 */
export function ConfirmDeleteAction({
  title,
  description,
  okText = "Delete",
  onConfirm,
}: {
  title: ReactNode;
  description?: ReactNode;
  okText?: string;
  onConfirm: () => void | Promise<unknown>;
}) {
  return (
    <ConfigProvider theme={confirmTheme}>
      <Popconfirm
        title={title}
        description={description}
        okText={okText}
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        placement="topRight"
        onConfirm={() => onConfirm()}
      >
        <button type="button" aria-label="Delete" title="Delete" className={actionClass("danger")}>
          <IconTrash className="size-4" />
        </button>
      </Popconfirm>
    </ConfigProvider>
  );
}
