import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { api, HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <>
      <h1 className="text-red-600">Hello World</h1>
      <Button>Click Me</Button>
    </>
  );
}
