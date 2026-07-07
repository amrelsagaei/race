import type { useConfirm } from "primevue/useconfirm";

type ConfirmService = ReturnType<typeof useConfirm>;

export function confirmDanger(
  confirm: ConfirmService,
  options: {
    header: string;
    message: string;
    acceptLabel: string;
    onAccept: () => void;
  },
): void {
  confirm.require({
    header: options.header,
    message: options.message,
    icon: "fas fa-exclamation-triangle",
    acceptLabel: options.acceptLabel,
    rejectLabel: "Cancel",
    accept: options.onAccept,
  });
}
