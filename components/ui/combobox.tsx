"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { debounce } from "@/utils/helpers/helper"; // Pastikan helper debounce ada dan berfungsi
import { useMemo } from "react";
import { ComboBoxItem } from "@/lib/types/form.types";
import { ModifiedClassicLoader } from "./loader";

// Tipe untuk data pagination
type PaginationType = {
  currentPage: number;
  totalPages: number;
};

// Definisikan tipe untuk props komponen ComboBox
interface ComboBoxProps {
  isModal?: boolean;
  label?: string;
  selected: ComboBoxItem | null | undefined | string;
  onChange: (selectedItem: ComboBoxItem | string) => void;
  data: ComboBoxItem[] | undefined | null;
  disabled?: boolean;
  title?: string;
  valueKey?: string;
  labelKey?: string;
  disabledText?: string;
  useInfiniteScroll?: boolean;
  pagination?: PaginationType;
  loadMore?: (page: number) => void;
  hint?: string;
  error?: boolean;
  success?: boolean;
  loadingSearch?: boolean;
  isLoadingMore?: boolean;
  handleSearchData?: (query: string) => void;
  useApiSearch?: boolean;
  prefixIcon?: React.ReactNode; // Prop baru untuk ikon prefix
  renderCustomChild?: (
    item: ComboBoxItem,
    isSelected: boolean
  ) => React.ReactNode;
  renderCustomSelectedItem?: (item: ComboBoxItem | null) => React.ReactNode;
}

export function ComboBox({
  isModal = true,
  label,
  onChange,
  selected,
  data,
  disabled = false,
  title = "item",
  valueKey = "id",
  labelKey = "nama",
  disabledText = "Silahkan pilih input diatas terlebih dahulu",
  useInfiniteScroll = false,
  pagination,
  loadMore,
  hint,
  error = false,
  success = false,
  loadingSearch,
  isLoadingMore,
  handleSearchData,
  useApiSearch = false,
  prefixIcon, // Destructure prop baru
  renderCustomChild,
  renderCustomSelectedItem,
}: ComboBoxProps) {
  // State Management
  const [open, setOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [displayedData, setDisplayedData] = React.useState<ComboBoxItem[]>(
    data || []
  );
  const commandListRef = React.useRef<HTMLDivElement | null>(null);

  // Effect untuk menyinkronkan data dari props ke state internal
  React.useEffect(() => {
    setDisplayedData(data || []);
  }, [data]);

  // Handler untuk membuka/menutup popover
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setDisplayedData(data || []);
    }
  };

  // Debounce untuk menangani input pencarian
  const debouncedHandleSearch = React.useMemo(
    () =>
      debounce((query: string) => {
        if (useApiSearch && handleSearchData) {
          handleSearchData(query);
        } else {
          const filteredData = (data || []).filter((item: ComboBoxItem) =>
            String(item[labelKey] ?? "")
              .toLowerCase()
              .includes(query.toLowerCase())
          );
          setDisplayedData(filteredData);
        }
      }, 300),
    [useApiSearch, handleSearchData, data, labelKey]
  );

  const handleInputChange = (query: string) => {
    setSearchQuery(query);
    debouncedHandleSearch(query);
  };

  // Infinite scroll logic
  React.useEffect(() => {
    const listElement = commandListRef.current;
    if (!useInfiniteScroll || !open || !listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

      if (
        isAtBottom &&
        !isLoadingMore &&
        pagination &&
        loadMore &&
        pagination.currentPage < pagination.totalPages
      ) {
        loadMore(pagination.currentPage + 1);
      }
    };

    listElement.addEventListener("scroll", handleScroll);
    return () => listElement.removeEventListener("scroll", handleScroll);
  }, [open, useInfiniteScroll, isLoadingMore, pagination, loadMore]);

  // Memoize untuk menentukan nilai yang terpilih
  const selectedValue = useMemo<ComboBoxItem | null>(() => {
    if (
      !selected ||
      (typeof selected === "object" && Object.keys(selected).length === 0)
    ) {
      return null;
    }
    if (typeof selected === "string") {
      return (data || []).find((item) => item[valueKey] === selected) || null;
    }
    return selected as ComboBoxItem;
  }, [selected, data, valueKey]);

  // Kalkulasi className untuk Button berdasarkan state
  const classButton = cn(
    "w-full justify-between rounded-full h-10 md:h-12 border transition-colors duration-300",
    {
      // Disabled State
      "bg-gray-100 border-gray-300 text-gray-500 opacity-50 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400":
        disabled,
      // Error State
      "bg-white border-error-500 text-error-900 focus:ring-2 focus:ring-error-500/20 dark:bg-slate-900 dark:border-error-500 dark:text-error-400":
        error && !disabled,
      // Success State
      "bg-white border-success-500 text-success-900 focus:ring-2 focus:ring-success-500/20 dark:bg-slate-900 dark:border-success-500 dark:text-success-400":
        success && !disabled,
      // Default State
      "bg-white border-none hover:bg-gray-50 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900 dark:border-gray-800 dark:hover:bg-slate-800 ":
        !disabled && !error && !success,
      // Text color based on selection
      "text-gray-900 dark:text-white": !!selectedValue,
      "text-gray-400 dark:text-gray-400": !selectedValue,
    }
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-normal text-gray-400 dark:text-white font-poppins">
          {label}
        </label>
      )}
      <Popover modal={isModal} open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={classButton}
          >
            <div className="flex justify-between w-full items-center">
              <div className="flex items-center truncate">
                {prefixIcon && (
                  <span className="mr-2 shrink-0">{prefixIcon}</span>
                )}
                <span className="truncate text-sm font-normal text-base">
                  {disabled
                    ? disabledText
                    : renderCustomSelectedItem && selectedValue
                      ? renderCustomSelectedItem(selectedValue)
                      : selectedValue?.[labelKey] ?? `Pilih ${title}...`}
                </span>
              </div>
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </motion.div>
            </div>
          </Button>
        </PopoverTrigger>
        <AnimatePresence>
          {open && (
            <PopoverContent
              asChild
              className="w-[var(--radix-popover-trigger-width)] p-0 z-99"
              style={{ pointerEvents: "auto" }}
              onOpenAutoFocus={(e) => e.preventDefault()} // Mencegah fokus otomatis yang mengganggu
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Command shouldFilter={!useApiSearch}>
                  <CommandInput
                    placeholder={`Cari ${title}...`}
                    className="h-9"
                    onValueChange={handleInputChange}
                    value={searchQuery}
                  />
                  {loadingSearch ? (
                    <div className="flex items-center justify-center p-4">
                      <ModifiedClassicLoader />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>{title} tidak ditemukan.</CommandEmpty>
                      <CommandList ref={commandListRef}>
                        <CommandGroup>
                          {displayedData.map((item: ComboBoxItem) => {
                            const isItemSelected =
                              selectedValue?.[valueKey] === item[valueKey];
                            return (
                              <CommandItem
                                key={item[valueKey]}
                                value={String(item[labelKey])}
                                onSelect={() => {
                                  const newValue = isItemSelected ? "" : item;
                                  onChange(newValue);
                                  setOpen(false);
                                }}
                              >
                                {renderCustomChild ? (
                                  renderCustomChild(item, isItemSelected)
                                ) : (
                                  <>
                                    {String(item[labelKey] ?? "")}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        isItemSelected
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </>
                                )}
                              </CommandItem>
                            );
                          })}
                          {useInfiniteScroll && isLoadingMore && (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </>
                  )}
                </Command>
              </motion.div>
            </PopoverContent>
          )}
        </AnimatePresence>
      </Popover>
      {hint && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500 dark:text-gray-400"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
