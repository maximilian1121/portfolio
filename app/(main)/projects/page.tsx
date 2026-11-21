"use client";

import Explorer from "@/components/explorers/Explorer";

export default function Projects() {
    return (
        <Explorer
            initialData={[] as { title: string }[]}
            searchableFields={["title"]}
            defaultSort="title"
            sortOptions={[{ label: "Title", value: "title" }]}
            renderItem={(item) => (
                <div className="p-4 border">{item.title}</div>
            )}
        />
    );
}
