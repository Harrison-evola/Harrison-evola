"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  calories: number | null;
  dietaryTags: string[];
  imageUrl: string | null;
}

interface MenuSection {
  id: string;
  name: string;
  items: MenuItem[];
}

// Demo data
const demoSections: MenuSection[] = [
  {
    id: "s1",
    name: "Appetizers",
    items: [
      { id: "i1", name: "Bruschetta", description: "Toasted bread with fresh tomatoes, basil, and garlic", price: 1200, isAvailable: true, calories: 280, dietaryTags: ["Vegetarian"], imageUrl: null },
      { id: "i2", name: "Calamari", description: "Crispy fried calamari with marinara sauce", price: 1400, isAvailable: true, calories: 450, dietaryTags: [], imageUrl: null },
      { id: "i3", name: "Caesar Salad", description: "Romaine lettuce, croutons, parmesan, Caesar dressing", price: 1100, isAvailable: true, calories: 320, dietaryTags: [], imageUrl: null },
    ],
  },
  {
    id: "s2",
    name: "Entrees",
    items: [
      { id: "i4", name: "Grilled Salmon", description: "Atlantic salmon with lemon herb butter, seasonal vegetables", price: 2800, isAvailable: true, calories: 520, dietaryTags: ["Gluten-Free"], imageUrl: null },
      { id: "i5", name: "Chicken Parmesan", description: "Breaded chicken breast, marinara, mozzarella, spaghetti", price: 2200, isAvailable: true, calories: 780, dietaryTags: [], imageUrl: null },
      { id: "i6", name: "Mushroom Risotto", description: "Arborio rice, wild mushrooms, truffle oil, parmesan", price: 2000, isAvailable: true, calories: 650, dietaryTags: ["Vegetarian", "Gluten-Free"], imageUrl: null },
      { id: "i7", name: "NY Strip Steak", description: "12oz aged steak, garlic mashed potatoes, asparagus", price: 3800, isAvailable: false, calories: 850, dietaryTags: ["Gluten-Free"], imageUrl: null },
    ],
  },
  {
    id: "s3",
    name: "Desserts",
    items: [
      { id: "i8", name: "Tiramisu", description: "Classic Italian dessert with espresso and mascarpone", price: 1000, isAvailable: true, calories: 380, dietaryTags: ["Vegetarian"], imageUrl: null },
      { id: "i9", name: "Chocolate Lava Cake", description: "Warm chocolate cake with molten center, vanilla ice cream", price: 1200, isAvailable: true, calories: 520, dietaryTags: ["Vegetarian"], imageUrl: null },
    ],
  },
  {
    id: "s4",
    name: "Beverages",
    items: [
      { id: "i10", name: "Espresso", description: null, price: 350, isAvailable: true, calories: 5, dietaryTags: ["Vegan", "Gluten-Free"], imageUrl: null },
      { id: "i11", name: "House Lemonade", description: "Fresh-squeezed lemonade with mint", price: 500, isAvailable: true, calories: 120, dietaryTags: ["Vegan", "Gluten-Free"], imageUrl: null },
    ],
  },
];

const tagColors: Record<string, string> = {
  Vegetarian: "bg-green-100 text-green-700",
  Vegan: "bg-emerald-100 text-emerald-700",
  "Gluten-Free": "bg-amber-100 text-amber-700",
  "Dairy-Free": "bg-blue-100 text-blue-700",
  "Nut-Free": "bg-purple-100 text-purple-700",
  Spicy: "bg-red-100 text-red-700",
};

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sections, setSections] = useState(demoSections);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(demoSections.map((s) => s.id))
  );
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    calories: "",
    dietaryTags: [] as string[],
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    setSections((prev) => [
      ...prev,
      { id: `s-new-${Date.now()}`, name: newSectionName, items: [] },
    ]);
    setNewSectionName("");
    setShowAddSection(false);
  };

  const handleAddItem = (sectionId: string) => {
    if (!newItem.name.trim()) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: `i-new-${Date.now()}`,
                  name: newItem.name,
                  description: newItem.description || null,
                  price: Math.round(parseFloat(newItem.price || "0") * 100),
                  isAvailable: true,
                  calories: newItem.calories ? parseInt(newItem.calories) : null,
                  dietaryTags: newItem.dietaryTags,
                  imageUrl: null,
                },
              ],
            }
          : s
      )
    );
    setNewItem({ name: "", description: "", price: "", calories: "", dietaryTags: [] });
    setShowAddItem(null);
  };

  const toggleItemAvailability = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i
              ),
            }
          : s
      )
    );
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/menus"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Menus
        </Link>
        <PageHeader title="Lunch Menu" description="Downtown Bistro">
          <Badge variant="secondary">
            {sections.length} sections, {totalItems} items
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            Push to Platforms
          </Button>
        </PageHeader>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddSection(true)}>
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader
              className="py-3 px-5 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-base">{section.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {section.items.length} items
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddItem(section.id);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has(section.id) && (
              <CardContent className="pt-0 px-5 pb-3">
                {section.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No items yet. Add the first item to this section.
                  </p>
                ) : (
                  <div className="divide-y">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 py-3 ${
                          !item.isAvailable ? "opacity-50" : ""
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {item.name}
                            </span>
                            {!item.isAvailable && (
                              <Badge variant="secondary" className="text-[10px]">
                                Unavailable
                              </Badge>
                            )}
                            {item.dietaryTags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  tagColors[tag] ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          {item.calories && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {item.calories} cal
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(item.price)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleItemAvailability(section.id, item.id)}
                            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteItem(section.id, item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>
              Create a new menu section (e.g., Appetizers, Entrees, Desserts).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddSection}>Add Section</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!showAddItem} onOpenChange={() => setShowAddItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to this section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Brief description..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="12.00"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Calories</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={newItem.calories}
                  onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dietary Tags</label>
              <div className="flex flex-wrap gap-2">
                {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Spicy"].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setNewItem((prev) => ({
                          ...prev,
                          dietaryTags: prev.dietaryTags.includes(tag)
                            ? prev.dietaryTags.filter((t) => t !== tag)
                            : [...prev.dietaryTags, tag],
                        }))
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                        newItem.dietaryTags.includes(tag)
                          ? tagColors[tag]
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => showAddItem && handleAddItem(showAddItem)}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
