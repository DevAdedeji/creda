export default defineAppConfig({
  ui: {
    colors: { primary: 'green', neutral: 'zinc' },
    button: { slots: { base: 'font-semibold cursor-pointer' } },
    modal: {
      slots: {
        header: 'relative flex items-start gap-1.5 p-4 sm:px-6 min-h-(--ui-header-height)',
        wrapper: 'min-w-0 w-[78%]',
        title: 'text-highlighted font-semibold text-pretty',
        description: 'mt-1 text-muted text-sm text-pretty',
      },
    },
  },
})
