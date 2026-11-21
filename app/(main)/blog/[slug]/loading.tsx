import { BreadcrumbEmitter } from "@/components/layout/BreadcrumbEmitter";
import LoadingTemplate from "@/app/loading";

export default function Loading() {
    return (
        <>
            <LoadingTemplate />
            <BreadcrumbEmitter name={"Blog post..."} />
        </>
    );
}
