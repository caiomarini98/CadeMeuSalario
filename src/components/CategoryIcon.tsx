import {
  ShoppingCart, Utensils, Car, Home, Heart, GraduationCap,
  Gamepad2, Smartphone, ShoppingBag, Zap, Package, Pizza,
  UtensilsCrossed, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'Mercado': ShoppingCart,
  'Alimentação (Trabalho)': UtensilsCrossed,
  'Alimentação (Lazer)': Pizza,
  'Alimentação': Utensils,
  'Transporte': Car,
  'Moradia': Home,
  'Saúde': Heart,
  'Educação': GraduationCap,
  'Lazer': Gamepad2,
  'Assinaturas': Smartphone,
  'Compras': ShoppingBag,
  'Serviços': Zap,
  'Outros': Package,
};

export function CategoryIcon({ name, color, size = 16 }: { name: string; color?: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon size={size} style={{ color: color ?? '#f0ece4' }} />;
}
