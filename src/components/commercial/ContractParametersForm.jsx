import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

const ContractParametersForm = ({ initialParams, onChange }) => {
    const [includedClauses, setIncludedClauses] = useState(initialParams?.included_clauses || []);
    const { commercialData } = useData();

    const activeClauses = useMemo(() => {
        return (commercialData?.clauses || []).filter(c => c.is_active);
    }, [commercialData.clauses]);

    useEffect(() => {
        // This effect only updates internal state when the initial prop changes.
        setIncludedClauses(initialParams?.included_clauses || []);
    }, [initialParams]);

    const handleCheckboxChange = (clauseId) => {
        const newIncluded = includedClauses.includes(clauseId)
            ? includedClauses.filter(id => id !== clauseId)
            : [...includedClauses, clauseId];
        setIncludedClauses(newIncluded);
        onChange({ ...initialParams, included_clauses: newIncluded });
    };

    const handleSelectAll = () => {
        const allActiveClauseIds = activeClauses.map(c => String(c.id));
        setIncludedClauses(allActiveClauseIds);
        onChange({ ...initialParams, included_clauses: allActiveClauseIds });
    };

    const handleDeselectAll = () => {
        setIncludedClauses([]);
        onChange({ ...initialParams, included_clauses: [] });
    };

    const { mainClauses, subClausesMap } = useMemo(() => {
        const main = [];
        const subMap = new Map();
        activeClauses.forEach(clause => {
            if (clause.parent_id) {
                if (!subMap.has(clause.parent_id)) {
                    subMap.set(clause.parent_id, []);
                }
                subMap.get(clause.parent_id).push(clause);
            } else {
                main.push(clause);
            }
        });
        main.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        subMap.forEach(subArray => subArray.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        return { mainClauses: main, subClausesMap: subMap };
    }, [activeClauses]);
    
    const includedClausesSet = useMemo(() => new Set(includedClauses), [includedClauses]);

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">3. Cláusulas Contratuais</h3>
            <div className="flex justify-end mb-4">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="mr-2">Selecionar Todas</Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>Desselecionar Todas</Button>
            </div>
            <Accordion type="multiple" className="w-full">
                {mainClauses.map(clause => {
                    const subClauses = subClausesMap.get(clause.id) || [];
                    const isParentChecked = includedClausesSet.has(String(clause.id));
                    return (
                        <AccordionItem value={`clause-${clause.id}`} key={clause.id}>
                            <AccordionTrigger>
                                <div className="flex items-center space-x-3 w-full">
                                    <Checkbox
                                        id={`clause-${clause.id}`}
                                        checked={isParentChecked}
                                        onCheckedChange={() => handleCheckboxChange(String(clause.id))}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label htmlFor={`clause-${clause.id}`} className="font-semibold text-base cursor-pointer">{clause.title}</Label>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8">
                                <p className="text-muted-foreground text-sm mb-2">{clause.content || "Esta cláusula principal serve como um título para as subcláusulas abaixo."}</p>
                                {subClauses.length > 0 && (
                                    <div className="space-y-2 mt-2 border-l-2 pl-4">
                                        <h4 className="font-semibold text-sm mb-2">Subcláusulas:</h4>
                                        {subClauses.map(sub => (
                                            <div key={sub.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`clause-${sub.id}`}
                                                    checked={includedClausesSet.has(String(sub.id))}
                                                    onCheckedChange={() => handleCheckboxChange(String(sub.id))}
                                                    disabled={!isParentChecked}
                                                />
                                                <Label htmlFor={`clause-${sub.id}`} className={!isParentChecked ? 'text-muted-foreground' : ''}>{sub.title}</Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
};

export default ContractParametersForm;