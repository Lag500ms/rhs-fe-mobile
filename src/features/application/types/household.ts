export type HouseholdRelationship =
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'OTHER';

export interface HouseholdMemberRequest {
  fullName: string;
  citizenId?: string;
  dateOfBirth?: string;
  relationship: HouseholdRelationship | string;
  note?: string;
}

export interface HouseholdMember {
  memberId: string;
  fullName: string;
  citizenId?: string | null;
  dateOfBirth?: string | null;
  relationship: string;
  note?: string | null;
  createdAt: string;
}

export const RELATIONSHIP_OPTIONS: { value: HouseholdRelationship; label: string }[] = [
  { value: 'SPOUSE', label: 'Vợ / Chồng' },
  { value: 'CHILD', label: 'Con' },
  { value: 'PARENT', label: 'Cha / Mẹ' },
  { value: 'SIBLING', label: 'Anh / Chị / Em' },
  { value: 'GRANDPARENT', label: 'Ông / Bà' },
  { value: 'GRANDCHILD', label: 'Cháu' },
  { value: 'OTHER', label: 'Khác' },
];

export function getRelationshipLabel(value: string): string {
  return RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label || value;
}
