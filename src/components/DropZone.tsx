import { useCallback, useRef, useState } from 'react'
import { FileSpreadsheet, ShieldCheck, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { parseWorkbook, WorkbookParseError } from '../parsing/parseWorkbook'
import { useAppStore } from '../state/store'

export function DropZone() {
  const setPlan = useAppStore((s) => s.setPlan)
  const setParseError = useAppStore((s) => s.setParseError)
  const parseError = useAppStore((s) => s.parseError)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!/\.xlsx$/i.test(file.name)) {
        setParseError(`"${file.name}" is not an .xlsx file. Please provide the L4 programme plan workbook exported from MS Project.`)
        return
      }
      setIsLoading(true)
      try {
        const plan = await parseWorkbook(file)
        setPlan(plan)
      } catch (err) {
        if (err instanceof WorkbookParseError) {
          setParseError(err.message)
        } else {
          setParseError('An unexpected error occurred while reading this workbook. Please check the file and try again.')
          // eslint-disable-next-line no-console
          console.error(err)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [setPlan, setParseError],
  )

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-surface)]/40'
              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--color-brand-blue)]/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--color-brand-navy)] flex items-center justify-center mb-5">
            <UploadCloud className="text-white" size={26} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {isLoading ? 'Reading your programme plan...' : 'Drop your L4 .xlsx here'}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            or click to browse for the MS Project Level-4 export workbook
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
            <ShieldCheck size={14} />
            <span>All processing happens locally in your browser. Nothing is uploaded anywhere.</span>
          </div>
        </div>

        {parseError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-[var(--color-rag-red)]/30 bg-[var(--color-rag-red)]/5 px-4 py-3 text-sm text-[var(--color-rag-red)] flex items-start gap-2"
          >
            <FileSpreadsheet size={16} className="mt-0.5 shrink-0" />
            <span>{parseError}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
