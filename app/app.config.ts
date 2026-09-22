export default defineAppConfig({
  ui: {
    colors: { primary: 'green', neutral: 'zinc' },
    button: {
      slots: { base: 'font-semibold cursor-pointer' },
      compoundVariants: [
        {
          size: 'md',
          square: false,
          variant: ['solid', 'outline', 'soft', 'subtle', 'ghost'],
          class: 'min-h-10',
        },
        {
          size: 'lg',
          square: false,
          variant: ['solid', 'outline', 'soft', 'subtle', 'ghost'],
          class: 'min-h-11',
        },
        {
          size: 'xl',
          square: false,
          variant: ['solid', 'outline', 'soft', 'subtle', 'ghost'],
          class: 'min-h-12',
        },
      ],
    },
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
