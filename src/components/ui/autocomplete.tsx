import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface AutocompleteOption {
  value: string
  label: string
}

interface AutocompleteProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

const Autocomplete = React.forwardRef<HTMLButtonElement, AutocompleteProps>(
  ({ options, value, onChange, placeholder = "Select option...", emptyText = "No results found.", className }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Debug logging
    React.useEffect(() => {
      console.log('Autocomplete props:', { options: options?.length, value, placeholder })
    }, [options, value, placeholder])

    const filteredOptions = React.useMemo(() => {
    if (!options || !Array.isArray(options)) {
      console.warn('Autocomplete: options is not a valid array', options)
      return []
    }
    if (!searchQuery) return options
    return options.filter(option =>
      option && typeof option === 'string' && option.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

    const handleSelect = React.useCallback((currentValue: string) => {
    try {
      console.log('Autocomplete handleSelect:', { currentValue, currentValueState: value })
      const newValue = currentValue === value ? "" : currentValue
      console.log('Autocomplete newValue:', newValue)
      
      // Use a small delay to prevent immediate state issues
      setTimeout(() => {
        if (onChange && typeof onChange === 'function') {
          onChange(newValue)
        }
        setOpen(false)
        setSearchQuery("")
      }, 0)
    } catch (error) {
      console.error('Error in Autocomplete handleSelect:', error)
    }
  }, [value, onChange])

    return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {(value && typeof value === 'string' ? value : '') || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="border rounded-md bg-popover">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 border-b rounded-b-none"
            />
            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="p-1">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={`${option}-${index}`}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full text-left",
                        value === option && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(option)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
Autocomplete.displayName = "Autocomplete"

export { Autocomplete }