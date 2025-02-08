"use client"

import { useState } from "react"
import { ChevronDown, Filter } from 'lucide-react'
import { cn } from "@/lib/utils"

const categories = [
  { 
    id: 1, 
    name: "Utilities",
    items: [
      { id: 'u1', name: "Water Bill Payment", distance: 0.2, availability: 95 },
      { id: 'u2', name: "Electricity Payment Center", distance: 0.5, availability: 88 },
      { id: 'u3', name: "Gas Service Center", distance: 0.8, availability: 75 },
      { id: 'u4', name: "Internet Provider", distance: 1.2, availability: 90 },
      { id: 'u5', name: "Phone Bill Center", distance: 1.5, availability: 85 }
    ]
  },
  { 
    id: 2, 
    name: "Food",
    items: [
      { id: 'f1', name: "Fresh Groceries Market", distance: 0.3, availability: 92 },
      { id: 'f2', name: "Local Bakery", distance: 0.6, availability: 85 },
      { id: 'f3', name: "Organic Food Store", distance: 0.9, availability: 78 },
      { id: 'f4', name: "Farmers Market", distance: 1.1, availability: 88 },
      { id: 'f5', name: "Convenience Store", distance: 0.4, availability: 96 }
    ]
  },
  { 
    id: 3, 
    name: "Medicines",
    items: [
      { id: 'm1', name: "24/7 Pharmacy", distance: 0.4, availability: 98 },
      { id: 'm2', name: "Medical Supply Store", distance: 0.7, availability: 85 },
      { id: 'm3', name: "Community Drugstore", distance: 1.0, availability: 90 },
      { id: 'm4', name: "Health & Wellness Shop", distance: 1.3, availability: 82 },
      { id: 'm5', name: "Hospital Pharmacy", distance: 1.6, availability: 95 }
    ]
  },
  { 
    id: 4, 
    name: "Doctors",
    items: [
      { id: 'd1', name: "Family Clinic", distance: 0.5, availability: 75 },
      { id: 'd2', name: "Urgent Care Center", distance: 0.8, availability: 85 },
      { id: 'd3', name: "Pediatric Clinic", distance: 1.2, availability: 70 },
      { id: 'd4', name: "Dental Office", distance: 1.4, availability: 65 },
      { id: 'd5', name: "General Practitioner", distance: 0.9, availability: 80 }
    ]
  }
]

export default function ScrollMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(categories[0])

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="w-full max-w-md mx-auto bg-white rounded-t-xl shadow-sm">

        {/* Toggle Bar */}

        <div 
          className="w-full cursor-pointer" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-12 h-1 bg-gray-200 mx-auto my-3 rounded-full" />
        </div>

        {/* Content */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[100vh]" : "max-h-0"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Filter className="w-5 h-5 text-gray-500" />
          </div>

          {/* Horizontal Scroll Menu */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 p-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                    activeCategory.id === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4">
            <div className="space-y-4">
              {activeCategory.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-card text-card-foreground"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary" />
                    <div>
                      <h3 className="font-medium">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.distance} miles away • {item.availability}% available
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
