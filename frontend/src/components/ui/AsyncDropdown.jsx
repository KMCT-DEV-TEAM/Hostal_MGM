import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown, Search, Loader2, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function AsyncDropdown({
    value,
    onChange,
    fetchOptions,
    placeholder = "Select...",
    getOptionLabel = (item) => item.label,
    getOptionValue = (item) => item.value,
    className = "",
    triggerClassName = "",
    placement = "bottom",
    error,
    isMulti = false,
    lookup = {},
    maxHeight = '200px',
    preload = false,
}) {
    const dropdownRef = useRef(null);
    const observerRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [dynamicPlacement, setDynamicPlacement] = useState(placement);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const [options, setOptions] = useState([]);

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);

    const [hasMore, setHasMore] = useState(true);

    const [initialLoading, setInitialLoading] = useState(false);

    const [lastFetchedQuery, setLastFetchedQuery] = useState(null);

    const loadOptions = useCallback(async (pageNo, keyword, reset = false) => {
        try {
            if (pageNo === 1)
                setInitialLoading(true);
            else
                setLoading(true);

            const result = await fetchOptions({
                page: pageNo,
                search: keyword,
            });

            if (reset)
                setOptions(result.options);
            else
                setOptions(prev => [...prev, ...result.options]);

            setHasMore(result.hasMore);

        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [fetchOptions]);

    useEffect(() => {
        if (!open && !preload)
            return;

        if (open && lastFetchedQuery === debouncedSearch && options.length > 0)
            return;

        setPage(1);

        loadOptions(1, debouncedSearch, true);
        setLastFetchedQuery(debouncedSearch);

    }, [debouncedSearch, open, preload, loadOptions, lastFetchedQuery, options.length]);

    useEffect(() => {

        if (!open)
            return;

        if (page === 1)
            return;

        loadOptions(page, debouncedSearch);

    }, [page]);

    useEffect(() => {

        function outside(e) {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }

        }

        document.addEventListener("mousedown", outside);

        return () =>
            document.removeEventListener("mousedown", outside);

    }, []);

    const lastItemRef = useCallback(node => {

        if (loading)
            return;

        if (observerRef.current)
            observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {

            if (
                entries[0].isIntersecting &&
                hasMore
            ) {
                setPage(prev => prev + 1);
            }

        });

        if (node)
            observerRef.current.observe(node);

    }, [loading, hasMore]);

    const selected = options.find(
        item => getOptionValue(item) === value
    );

    const handleToggle = () => {
        if (!open) {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 250; // estimated max height (maxHeight prop is usually '200px' + search bar)

                let spaceBelowParent = spaceBelow;
                let scrollParent = dropdownRef.current.parentElement;
                while (scrollParent) {
                    if (scrollParent === document.body || scrollParent === document.documentElement) break;
                    const style = window.getComputedStyle(scrollParent);
                    if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
                        const parentRect = scrollParent.getBoundingClientRect();
                        spaceBelowParent = parentRect.bottom - rect.bottom;
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                if (spaceBelowParent < dropdownHeight && rect.top > dropdownHeight) {
                    setDynamicPlacement('top');
                } else {
                    setDynamicPlacement(placement);
                }
            }
        }
        setOpen(!open);
    };

    return (
        <div
            ref={dropdownRef}
            className={`relative ${className}`}
            onClick={(e) => e.stopPropagation()}
        >

            <button
                type="button"
                onClick={handleToggle}
                className={`flex items-center justify-between w-full border rounded-lg outline-none transition-colors ${triggerClassName || 'px-3 py-2 text-sm bg-white border-gray-200 focus:border-secondary'}`}
            >
                <span className="truncate flex flex-wrap gap-1 items-center mr-2 font-inherit text-inherit">

                    {isMulti ? (
                        (value && value.length > 0) ? value.map((v) => {
                            const opt = options.find(o => getOptionValue(o) === v) || lookup[v] || { label: v };
                            return (
                                <span key={v} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium">
                                    {getOptionLabel(opt)}
                                    <X
                                        className="w-3 h-3 hover:text-gray-900 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(value.filter((val) => val !== v));
                                        }}
                                    />
                                </span>
                            );
                        }) : placeholder
                    ) : (
                        selected ? getOptionLabel(selected) : placeholder
                    )}

                </span>

                <ChevronDown
                    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />

            </button>

            {open && (

                <div
                    style={{ maxHeight: maxHeight }}
                    className={`absolute z-50 flex flex-col min-w-full w-full max-w-100 ${dynamicPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none`}
                >

                    <div className="sticky top-0 bg-white px-2 py-1.5 border-b border-gray-100 z-10 shrink-0">

                        <div className="relative">

                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-secondary transition-colors focus:bg-white"
                            />

                        </div>

                    </div>

                    {initialLoading ? (

                        <div className="p-4 flex justify-center">

                            <Loader2 className="animate-spin w-5 h-5" />

                        </div>

                    ) : options.length === 0 ? (

                        <div className="p-3 text-center text-gray-400 text-sm">

                            No data found

                        </div>

                    ) : (

                        options.map((item, index) => {

                            const isLast =
                                index === options.length - 1;

                            return (

                                <button
                                    ref={isLast ? lastItemRef : null}
                                    key={getOptionValue(item)}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const val = getOptionValue(item);
                                        if (isMulti) {
                                            if (value.includes(val)) {
                                                onChange(value.filter(v => v !== val));
                                            } else {
                                                onChange([...(value || []), val]);
                                            }
                                        } else {
                                            onChange(val);
                                            setOpen(false);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 whitespace-normal wrap-break-word cursor-pointer ${(isMulti ? (value || []).includes(getOptionValue(item)) : value === getOptionValue(item))
                                        ? "bg-blue-50/50 text-secondary font-medium"
                                        : "text-gray-700"
                                        }`}
                                >

                                    {getOptionLabel(item)}

                                </button>

                            );

                        })

                    )}

                    {loading && (

                        <div className="flex justify-center p-3">

                            <Loader2 className="animate-spin w-5 h-5" />

                        </div>

                    )}

                </div>

            )}

            {error && <p className="text-danger text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error}</p>}

        </div>
    );
}
