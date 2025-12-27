local fs = vim.fs

vim.lsp.config('ruby_lsp', {
  cmd = { "ruby-lsp" },          -- adjust if you need rbenv/rvm shims
  --root_dir = vim.loop.cwd(),
  root_markers = { ".ruby-lsp" },

  init_options = {
    formatter = "standard",
    linters = { "standard" },
  },
})

vim.lsp.enable('ruby_lsp')
