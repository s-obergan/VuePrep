const TOAST_VISIBLE_MS = 3000

interface ToastState {
  message: string
  visible: boolean

  token: number
}

export function useToast() {
  const toast = useState<ToastState>('toast', () => ({
    message: '',
    visible: false,
    token: 0,
  }))

  function show(message: string): void {
    toast.value.message = message
    toast.value.visible = true
    const token = (toast.value.token += 1)

    setTimeout(() => {
      if (toast.value.token === token) toast.value.visible = false
    }, TOAST_VISIBLE_MS)
  }

  return { toast, show }
}
