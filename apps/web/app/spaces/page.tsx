"use client";
  
  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { Button } from "@repo/ui/button";
  import { Card } from "@repo/ui/card";
  import { Navbar } from "../../components/navbar";
  import { CreateSpaceModal } from "../../components/create-space-modal";
  import { getAuthToken } from "../../lib/auth-token";
  import { listSpaces, deleteSpace, type SpaceSummary } from
  "../../lib/space-api";
  
  type Status = "loading" | "ready" | "error";

export default function SpacePage() {
    const router = useRouter();

    //explain me this types like the useState<Spacesummary> and what is the difference between this and i do this useState(<SpaceSummary>) then what is the difference in this 
    const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [isCreateOpen , setIsCreateOpen] = useState(false);

    /// we say we use the useeffect for side effect what does it even mean what side effect is here like in this we are going the function call mostly no api call i then why to use it use case what i can think of is that as the depency changes we can use this these values change which can not be inthe normal function 

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            /// rexplain this this replace why not the push in the easy way 
            router.replace("/signin");
            return;
        }

        // why we are sending the token where wehn we have already check the token is is for to access the spaces i have created like to have that spaces also
        listSpaces(token)
        //.then is used to handle the success the like the listspaces will return the promise and it might be error success if succes then this then will be used 
        // i have a question what is his promise i used to think it is similar to the aysnc await 
            .then((res) => {
                //Argument of type 'SpaceSummary[]' is not assignable to parameter of type 'SetStateAction<undefined>'.  Type 'SpaceSummary[]' provides no match for the signature '(prevState: undefined): undefined'.ts(2345) this was the error now i have seen in the code so i find out what was the problem but what if i have never seen the code then how to find this error

                setSpaces(res.spaces);
                setStatus("ready");
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "failed to load spaces");
                setStatus("error");

            })
    }, [router]);

    function handleEnter(spaceId: string) {
        router.push(`/space/${spaceId}`)
    }

    // like the main question in the interview are mainly this what is async and the synchoronous function like from my understanding what is thingk is that like the synchrnous function each step run one by one and in the async the steps run in the parallel like an api calls
    async function handleDelete(spaceId: string) {
        const token = getAuthToken();
        if (!token) return;

        if (!window.confirm("Delete this space? This cannot be undone.")) return;

        try {

            await deleteSpace(token, spaceId);
            //i do understand what is this but like why we use this fitler here like what is this even explain this like space.id !== spaceId like are we setting this in the spae that this space != to space id i did not understand this meaning here
            setSpaces((current) => current.filter((space) => space.id !== spaceId))
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete the space");
        };

    }

    const visibleSpaces = spaces.filter((spaces) =>
        //what does this do i think this is used for the finding hte search like findng the perticular space i thin but explain me this syntax and even why thier is a query what is i have only done this space.name.tolowercase
        spaces.name.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <Navbar />
            {/* explin me this main tag what does this do in this why this tag why not other */}
            {/* mx-auto i actually dont not what this actully does but in this but what is think it does is that it that like center the div because of the mx-auto */}
            <main className="mx-auto max-w-6xl px-6 py-10 ">
                {/* what does this flex col do i forget that like i think like what i remember is that like if i write the only flex than the two div comes together like one beside other but inthis it comes bellow it may be  and this sm md i think these value work like if the sm or upper value is hit do this value like this */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Your Spaces
                        </h1>
                        <p className="mt-1 text-sm text-neutral-400">
                            Jump back into a room or create a new one .
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="text"
                            value={query}
                            onChange={(event) =>
                                setQuery(event.target.value)
                            }
                            placeholder="Search spaces"
                            className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                        />
                        <Button
                            variant="primary"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            Create Space
                        </Button>
                    </div>
                </div>
                <div className="mt-8">
                    {status === "loading" && (
                        <p className=" text-neutral-600">
                            Loading your spaces...
                        </p>
                    )}
                    {status === "error" && <p className="text-red-400">{error}</p>}
                    {status === "ready" && visibleSpaces.length === 0 && (
                        <div className="rounded-2xl border border-dashed
                        border-neutral-800 p-12 text-center">
                            <p className="text-neutral-300">No spaces yet.</p>
                            <p className="text-sm text-neutral-500">
                                Create your first space to get started.</p>
                        </div>
                    )}
                    {status === "ready" && visibleSpaces.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* what are this grid similar to the flex cols i think like these do this only like break the page the screen in the column only like this 2 or 3 like this */}
                            {visibleSpaces.map((s) => (
                                <Card key={s.id} className="flex flex-col gap-3">
                                    <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-800 text-3xl font-semibold text-neutral-500">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h2 className="text-lg font-semibold">{s.name}</h2>
                                    {s.dimensions && (
                                        <p className="text-xs text-neutral-500">
                                            {s.dimensions}
                                        </p>
                                    )}
                                    {s.thumbnail && (
                                        <img
                                            src={s.thumbnail}
                                            alt={s.name}
                                            className="rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="mt-auto flex gap-2">
                                        <Button variant="primary" onClick={() => handleEnter(s.id)}>
                                            Enter
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleDelete(s.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            </main>

            <CreateSpaceModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={(space) => setSpaces((prev) => [space, ...prev])}
            />

        </div>
    )

}