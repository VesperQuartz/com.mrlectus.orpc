import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "#/base";

export interface Planet {
  id: string;
  name: string;
  tags: string[];
}

const planets: Planet[] = [
  { id: "earth", name: "Earth", tags: ["terrestrial", "habitable"] },
  { id: "mars", name: "Mars", tags: ["terrestrial"] },
  { id: "jupiter", name: "Jupiter", tags: ["gas-giant"] },
];

export const listPlanets = base
  .route({ method: "GET", path: "/planets" })
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(20),
      filters: z
        .object({
          name: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ input }) => {
    const name = input.filters?.name?.toLowerCase();
    const tags = input.filters?.tags ?? [];

    return planets
      .filter((planet) => {
        const matchesName = !name || planet.name.toLowerCase().includes(name);
        const matchesTags = tags.every((tag) => planet.tags.includes(tag));
        return matchesName && matchesTags;
      })
      .slice(0, input.limit);
  });

export const getPlanet = base
  .route({ method: "GET", path: "/planets/{id}" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const planet = planets.find((candidate) => candidate.id === input.id);

    if (!planet) {
      throw new ORPCError("NOT_FOUND", { message: "Planet not found" });
    }

    return planet;
  });

export const router = {
  planet: {
    list: listPlanets,
    get: getPlanet,
  },
};
