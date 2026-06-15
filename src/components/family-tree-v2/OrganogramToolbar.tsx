import React from 'react';
import { Person, getFullName } from '@/types/family';
import { SlidersHorizontal, UserCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ORGANOGRAM_FIELDS,
  type OrganogramFieldId,
} from '@/lib/family-tree/organogram-fields';

interface OrganogramToolbarProps {
  persons: Person[];
  rootPersonId: string | null;
  onRootChange: (personId: string) => void;
  visibleFields: Set<OrganogramFieldId>;
  onToggleField: (fieldId: OrganogramFieldId) => void;
}

const OrganogramToolbar: React.FC<OrganogramToolbarProps> = ({
  persons,
  rootPersonId,
  onRootChange,
  visibleFields,
  onToggleField,
}) => {
  const sorted = [...persons].sort((a, b) =>
    getFullName(a).localeCompare(getFullName(b), 'pt-BR', { sensitivity: 'base' }),
  );

  const selectedCount = visibleFields.size;

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex-1 min-w-0">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          <UserCircle2 className="h-3.5 w-3.5" />
          Pessoa central da árvore
        </label>
        <Select value={rootPersonId ?? undefined} onValueChange={onRootChange}>
          <SelectTrigger className="w-full sm:max-w-md bg-background">
            <SelectValue placeholder="Selecione uma pessoa..." />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {sorted.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {getFullName(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4" />
              Informações no card
              {selectedCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {selectedCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Exibir nos cards</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORGANOGRAM_FIELDS.map((field) => (
              <DropdownMenuCheckboxItem
                key={field.id}
                checked={visibleFields.has(field.id)}
                onCheckedChange={() => onToggleField(field.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {field.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default OrganogramToolbar;
