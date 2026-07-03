import {
  IconArrowsExchange,
  IconBarbell,
  IconBeer,
  IconBike,
  IconBook,
  IconBriefcase,
  IconBus,
  IconCamera,
  IconCar,
  IconCash,
  IconCoffee,
  IconCreditCard,
  IconDeviceGamepad2,
  IconDeviceTv,
  IconDots,
  IconFileInvoice,
  IconFirstAidKit,
  IconGasStation,
  IconGift,
  IconHeart,
  IconHome,
  IconMovie,
  IconMusic,
  IconPaw,
  IconPhone,
  IconPigMoney,
  IconPizza,
  IconPlane,
  IconShirt,
  IconShoppingCart,
  IconTag,
  IconToolsKitchen2,
  IconWifi,
  type Icon,
} from "@tabler/icons-react";

// Slugs de Category.icon -> ícono de Tabler. Los primeros diez son los del
// seed (DEFAULT_CATEGORIES en default-rules.ts); el resto está disponible en
// el picker para categorías propias. Las categorías sin icon caen en el
// fallback (etiqueta genérica).
const ICON_BY_SLUG: Record<string, Icon> = {
  coffee: IconCoffee,
  "shopping-cart": IconShoppingCart,
  shirt: IconShirt,
  "file-invoice": IconFileInvoice,
  car: IconCar,
  heart: IconHeart,
  "device-tv": IconDeviceTv,
  "tools-kitchen-2": IconToolsKitchen2,
  "piggy-bank": IconPigMoney,
  dots: IconDots,
  home: IconHome,
  plane: IconPlane,
  gift: IconGift,
  book: IconBook,
  barbell: IconBarbell,
  "gas-station": IconGasStation,
  wifi: IconWifi,
  phone: IconPhone,
  music: IconMusic,
  movie: IconMovie,
  camera: IconCamera,
  "credit-card": IconCreditCard,
  cash: IconCash,
  briefcase: IconBriefcase,
  "device-gamepad-2": IconDeviceGamepad2,
  pizza: IconPizza,
  beer: IconBeer,
  bus: IconBus,
  bike: IconBike,
  paw: IconPaw,
  "first-aid-kit": IconFirstAidKit,
  "arrows-exchange": IconArrowsExchange,
};

export function CategoryIcon({
  icon,
  color,
  size = 16,
  className,
}: {
  icon?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const IconComponent = (icon && ICON_BY_SLUG[icon]) || IconTag;
  return (
    <IconComponent
      size={size}
      stroke={1.75}
      className={className}
      style={{ color: color ?? undefined }}
      aria-hidden
    />
  );
}
