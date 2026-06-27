import { FLATGROUND } from "@/lib/skate/domains/flatground";
import { GRINDS } from "@/lib/skate/domains/grinds";
import type { Domain, DomainId } from "@/lib/skate/types";

export const DOMAINS: Record<DomainId, Domain> = {
  flatground: FLATGROUND,
  grinds: GRINDS,
};

/** Domains in display order. */
export const DOMAIN_LIST: Domain[] = [FLATGROUND, GRINDS];
