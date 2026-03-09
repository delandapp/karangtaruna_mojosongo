"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

export type Option = {
    label: string;
    value: string;
};

interface MultipleComboBoxProps {
    options: Option[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    emptyText?: string;
    label?: string;
    disabled?: boolean;
}

export function MultipleComboBox({
    options,
    selected,
    onChange,
    placeholder = "Pilih item...",
    emptyText = "Tidak ditemukan.",
    label,
    disabled = false,
}: MultipleComboBoxProps) {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (value: string) => {
        onChange(selected.filter((s) => s !== value));
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label className="text-sm font-medium">{label}</label>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-auto min-h-10 py-2"
                        disabled={disabled}
                    >
                        <div className="flex flex-wrap gap-1">
                            {selected.length === 0 && (
                                <span className="text-muted-foreground font-normal">
                                    {placeholder}
                                </span>
                            )}
                            {selected.map((val) => {
                                const opt = options.find((o) => o.value === val);
                                return opt ? (
                                    <Badge
                                        variant="secondary"
                                        key={val}
                                        className="mr-1 mb-1 font-normal flex items-center gap-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnselect(val);
                                        }}
                                    >
                                        {opt.label}
                                        <div
                                            className="ml-1 ring-offset-background rounded-full outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUnselect(val);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                ) : null;
                            })}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                        <CommandInput placeholder={`Cari...`} />
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandList>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            if (selected.includes(option.value)) {
                                                onChange(selected.filter((val) => val !== option.value));
                                            } else {
                                                onChange([...selected, option.value]);
                                            }
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selected.includes(option.value)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
