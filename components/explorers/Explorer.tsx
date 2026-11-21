"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ExplorerRecord = Record<string, unknown>;

export type ExplorerFetchOptions = {
    search: string;
    sortBy: string;
    order: "asc" | "desc";
    page: number;
    pageSize: number;
};

type ExplorerProps<T extends ExplorerRecord> = {
    explorerName?: string;
    initialData?: T[];
    fetchData?: (
        options: ExplorerFetchOptions,
    ) => Promise<{ data: T[]; hasMore: boolean }>;
    searchableFields: (keyof T & string)[];
    sortOptions: { label: string; value: keyof T & string }[];
    defaultSort: keyof T & string;
    renderItem: (item: T) => React.ReactNode;
    pageSize?: number;
};

function compareValues(left: unknown, right: unknown): number {
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }

    return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
    });
}

export default function Explorer<T extends ExplorerRecord>({
    explorerName = "Explorer",
    initialData = [],
    fetchData,
    searchableFields,
    sortOptions,
    defaultSort,
    renderItem,
    pageSize = 10,
}: ExplorerProps<T>) {
    const [data, setData] = useState(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<keyof T & string>(defaultSort);
    const [order, setOrder] = useState<ExplorerFetchOptions["order"]>("desc");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryPage, setRetryPage] = useState<number | null>(null);
    const requestId = useRef(0);
    const fetchDataRef = useRef(fetchData);

    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);

    const isAsync = Boolean(fetchData);

    useEffect(() => {
        if (!isAsync || !fetchDataRef.current) return;

        const currentRequest = ++requestId.current;
        setLoadError(false);
        setRetryPage(null);
        const timeout = window.setTimeout(async () => {
            setLoading(true);

            try {
                const result = await fetchDataRef.current?.({
                    search: searchTerm,
                    sortBy,
                    order,
                    page: 1,
                    pageSize,
                });

                if (!result || currentRequest !== requestId.current) return;
                setData(result.data);
                setHasMore(result.hasMore);
                setPage(1);
            } catch (error) {
                if (currentRequest === requestId.current) {
                    console.error("Failed to load explorer items:", error);
                    setLoadError(true);
                    setRetryPage(1);
                }
            } finally {
                if (currentRequest === requestId.current) setLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timeout);
            if (requestId.current === currentRequest) requestId.current += 1;
        };
    }, [isAsync, order, pageSize, searchTerm, sortBy]);

    const clientData = useMemo(() => {
        if (isAsync) return data;

        const normalizedSearch = searchTerm.toLocaleLowerCase();

        return [...data]
            .filter((item) =>
                searchableFields.some((field) =>
                    String(item[field] ?? "")
                        .toLocaleLowerCase()
                        .includes(normalizedSearch),
                ),
            )
            .sort((left, right) => {
                const result = compareValues(left[sortBy], right[sortBy]);
                return order === "asc" ? result : -result;
            });
    }, [data, isAsync, order, searchableFields, searchTerm, sortBy]);

    const loadMore = async () => {
        const fetch = fetchDataRef.current;
        if (!fetch || loading || (!hasMore && !loadError)) return;

        const currentRequest = requestId.current;
        const requestedPage = retryPage ?? page + 1;
        setLoading(true);
        setLoadError(false);

        try {
            const result = await fetch({
                search: searchTerm,
                sortBy,
                order,
                page: requestedPage,
                pageSize,
            });

            if (currentRequest !== requestId.current) return;
            if (requestedPage === 1) {
                setData(result.data);
            } else {
                setData((previous) => [...previous, ...result.data]);
            }
            setHasMore(result.hasMore);
            setPage(requestedPage);
            setRetryPage(null);
        } catch (error) {
            if (currentRequest === requestId.current) {
                console.error("Failed to load more explorer items:", error);
                setLoadError(true);
                setRetryPage(requestedPage);
            }
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    };

    return (
        <div className="flex flex-col max-w-4xl mx-auto gap-6">
            <fieldset>
                <legend>{explorerName}</legend>

                <div className="flex gap-2 flex-wrap items-center">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search..."
                        className="mr-2"
                        aria-label="Search items"
                    />
                    <label htmlFor="explorer-sort">Sort by:</label>
                    <select
                        id="explorer-sort"
                        value={sortBy}
                        onChange={(event) =>
                            setSortBy(event.target.value as keyof T & string)
                        }
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="explorer-order">Order:</label>
                    <select
                        id="explorer-order"
                        value={order}
                        onChange={(event) =>
                            setOrder(
                                event.target.value as ExplorerFetchOptions["order"],
                            )
                        }
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </fieldset>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {clientData.map((item, index) => (
                    <div
                        key={String(item.id ?? item.slug ?? index)}
                    >
                        {renderItem(item)}
                    </div>
                ))}
            </div>

            {isAsync && (hasMore || loadError) && (
                <div className="flex justify-center p-5">
                    <button onClick={loadMore} disabled={loading}>
                        {loading
                            ? "Loading..."
                            : loadError
                              ? "Retry"
                              : "Load More Items"}
                    </button>
                </div>
            )}

            {loadError && (
                <p className="text-center text-red-700" role="alert">
                    Items could not be loaded. Please try again.
                </p>
            )}

            <div className="status-bar w-full" aria-live="polite">
                <p className="status-bar-field">Items: {clientData.length}</p>
                <p className="status-bar-field">
                    State: {loading ? "Busy" : "Ready"}
                </p>
            </div>
        </div>
    );
}
