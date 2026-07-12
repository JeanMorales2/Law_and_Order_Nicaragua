import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Stars } from "../components/Stars";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { CitizenTabParamList } from "../navigation/AppTabsNavigator";
import { getCategories } from "../services/api/categories";
import { SEARCH_PAGE_SIZE, searchServices } from "../services/api/services";
import type { CategoryResponse, SearchServiceResponse, SearchServiceSortBy } from "../services/api/contracts";
import { theme } from "../theme";

type SortOption = {
  label: string;
  value: SearchServiceSortBy;
};

type CitizenHomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<CitizenTabParamList, "CitizenHome">,
  NativeStackNavigationProp<RootStackParamList>
>;

const sortOptions: SortOption[] = [
  { label: "Relevancia", value: "relevance" },
  { label: "Mejor calificados", value: "rating" },
  { label: "Menor precio", value: "price" },
];

export function CitizenHomeScreen() {
  const navigation = useNavigation<CitizenHomeNavigation>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<SearchServiceSortBy>("relevance");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categories = useMemo(() => flattenCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);

  const servicesQuery = useInfiniteQuery({
    queryKey: ["services", "search", debouncedSearch, selectedCategoryId, sortBy],
    queryFn: ({ pageParam }) =>
      searchServices({
        query: debouncedSearch,
        categoryId: selectedCategoryId,
        sortBy,
        page: pageParam,
        pageSize: SEARCH_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const services = useMemo(
    () => servicesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [servicesQuery.data],
  );

  const totalCount = servicesQuery.data?.pages[0]?.totalCount ?? 0;
  const hasInitialError = servicesQuery.isError || categoriesQuery.isError;
  const isInitialLoading = servicesQuery.isLoading || categoriesQuery.isLoading;

  function retryAll() {
    void categoriesQuery.refetch();
    void servicesQuery.refetch();
  }

  function openProfile(lawyerId: number) {
    navigation.navigate("LawyerProfile", { lawyerId });
  }

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 92, 120) }]}
        data={hasInitialError || isInitialLoading ? [] : services}
        keyExtractor={(item) => String(item.serviceId)}
        ListEmptyComponent={
          hasInitialError ? (
            <ErrorState onRetry={retryAll} />
          ) : isInitialLoading ? (
            <SkeletonList />
          ) : (
            <EmptyState />
          )
        }
        ListFooterComponent={
          servicesQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={theme.colors.gold} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <HomeHeader
            categories={categories}
            categoriesLoading={categoriesQuery.isLoading}
            onSearchChange={setSearch}
            onSelectCategory={setSelectedCategoryId}
            onSelectSort={setSortBy}
            search={search}
            selectedCategoryId={selectedCategoryId}
            sortBy={sortBy}
            totalCount={totalCount}
          />
        }
        onEndReached={() => {
          if (servicesQuery.hasNextPage && !servicesQuery.isFetchingNextPage) {
            void servicesQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <LawyerCard item={item} onPress={() => openProfile(item.lawyerProfileId)} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function HomeHeader({
  categories,
  categoriesLoading,
  onSearchChange,
  onSelectCategory,
  onSelectSort,
  search,
  selectedCategoryId,
  sortBy,
  totalCount,
}: {
  categories: CategoryResponse[];
  categoriesLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectCategory: (value: number | undefined) => void;
  onSelectSort: (value: SearchServiceSortBy) => void;
  search: string;
  selectedCategoryId?: number;
  sortBy: SearchServiceSortBy;
  totalCount: number;
}) {
  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroKicker}>LegalNic</Text>
            <Text style={styles.heroTitle}>Encuentra apoyo legal</Text>
          </View>
          <View style={styles.seal}>
            <Ionicons color={theme.colors.gold} name="scale-outline" size={24} />
          </View>
        </View>
        <Text style={styles.heroCopy}>Busca abogados y estudiantes verificados por servicio, ciudad o nombre.</Text>
        <View style={styles.fileTab}>
          <View style={styles.tabHandle}>
            <Text style={styles.tabHandleText}>Expediente</Text>
          </View>
          <View style={styles.searchBox}>
            <Ionicons color={theme.colors.inkSoft} name="search-outline" size={20} />
            <TextInput
              autoCapitalize="none"
              onChangeText={onSearchChange}
              placeholder="Divorcio, escritura, migracion..."
              placeholderTextColor={theme.colors.inkSoft}
              returnKeyType="search"
              style={styles.searchInput}
              value={search}
            />
            {search.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => onSearchChange("")} style={styles.clearButton}>
                <Ionicons color={theme.colors.navy} name="close" size={18} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <CategoryChip label="Todas" selected={!selectedCategoryId} onPress={() => onSelectCategory(undefined)} />
          {categoriesLoading ? (
            <CategoryChip label="Cargando..." selected={false} />
          ) : (
            categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                selected={selectedCategoryId === category.id}
                onPress={() => onSelectCategory(category.id)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.sortHeader}>
          <Text style={styles.sectionTitle}>Profesionales</Text>
          <Text style={styles.resultCount}>{totalCount} resultados</Text>
        </View>
        <View style={styles.sortControl}>
          {sortOptions.map((option) => {
            const selected = sortBy === option.value;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => onSelectSort(option.value)}
                style={[styles.sortOption, selected && styles.sortOptionSelected]}
              >
                <Text style={[styles.sortLabel, selected && styles.sortLabelSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        selected && styles.categoryChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function LawyerCard({ item, onPress }: { item: SearchServiceResponse; onPress: () => void }) {
  const rating = item.averageRating ?? 0;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.lawyerName)}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleBlock}>
            <Text numberOfLines={1} style={styles.lawyerName}>
              {item.lawyerName}
            </Text>
            <Text numberOfLines={1} style={styles.serviceName}>
              {item.serviceName}
            </Text>
          </View>
          <Ionicons color={theme.colors.navySoft} name="chevron-forward" size={20} />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons color={theme.colors.inkSoft} name="location-outline" size={15} />
            <Text numberOfLines={1} style={styles.metaText}>
              {item.city || "Nicaragua"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons color={theme.colors.inkSoft} name="time-outline" size={15} />
            <Text style={styles.metaText}>{item.estimatedDays} dias</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Stars rating={rating} total={item.reviewCount} />
          <Text style={styles.price}>C$ {formatMoney(item.price)}</Text>
        </View>
        <View style={styles.badgeRow}>
          {item.isVerified ? <Text style={styles.verifiedBadge}>Verificado</Text> : null}
          {item.isStudent ? <Text style={styles.studentBadge}>Estudiante</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function SkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, styles.skeletonLineWide]} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.gold} name="folder-open-outline" size={34} />
      <Text style={styles.stateTitle}>No encontramos profesionales para tu búsqueda</Text>
      <Text style={styles.stateCopy}>Prueba otra categoria o ajusta el texto del expediente.</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Ionicons color={theme.colors.rojo} name="cloud-offline-outline" size={34} />
      <Text style={styles.stateTitle}>No pudimos cargar los profesionales</Text>
      <Text style={styles.stateCopy}>Revisa tu conexion e intenta nuevamente.</Text>
      <Button label="Reintentar" onPress={onRetry} variant="dark" />
    </View>
  );
}

function flattenCategories(categories: CategoryResponse[]): CategoryResponse[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.subcategories ?? [])]);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
  },
  hero: {
    backgroundColor: theme.colors.navy,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  heroKicker: {
    ...theme.typography.label,
    color: theme.colors.gold,
    textTransform: "uppercase",
  },
  heroTitle: {
    ...theme.typography.h1,
    color: theme.colors.paper,
    marginTop: theme.spacing.xxs,
  },
  heroCopy: {
    ...theme.typography.body,
    color: theme.colors.goldSoft,
    marginTop: theme.spacing.sm,
    maxWidth: 320,
  },
  seal: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.navyDeep,
    borderWidth: 1,
    borderColor: theme.colors.navySoft,
  },
  fileTab: {
    marginTop: theme.spacing.xl,
  },
  tabHandle: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.goldSoft,
    borderTopLeftRadius: theme.radii.sm,
    borderTopRightRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  tabHandleText: {
    ...theme.typography.label,
    color: theme.colors.navy,
    textTransform: "uppercase",
  },
  searchBox: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.paper,
    borderTopRightRadius: theme.radii.md,
    borderBottomLeftRadius: theme.radii.md,
    borderBottomRightRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    ...theme.typography.body,
    color: theme.colors.ink,
    flex: 1,
    minHeight: 54,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  filterBlock: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  chipRow: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  categoryChip: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  categoryChipText: {
    ...theme.typography.bodySm,
    color: theme.colors.ink,
  },
  categoryChipTextSelected: {
    color: theme.colors.paper,
  },
  sortHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  resultCount: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  sortControl: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xxs,
  },
  sortOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  sortOptionSelected: {
    backgroundColor: theme.colors.white,
  },
  sortLabel: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
    textAlign: "center",
  },
  sortLabelSelected: {
    color: theme.colors.navy,
    fontFamily: theme.fontFamilies.bodySemiBold,
  },
  card: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  avatarText: {
    ...theme.typography.h3,
    color: theme.colors.navy,
  },
  cardBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  cardTitleBlock: {
    flex: 1,
  },
  lawyerName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
  },
  serviceName: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    maxWidth: 150,
  },
  metaText: {
    ...theme.typography.bodySm,
    color: theme.colors.inkSoft,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  price: {
    ...theme.typography.bodyMedium,
    color: theme.colors.verde,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  verifiedBadge: {
    ...theme.typography.label,
    color: theme.colors.verde,
    backgroundColor: "rgba(63, 122, 92, 0.12)",
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  studentBadge: {
    ...theme.typography.label,
    color: theme.colors.navy,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
  },
  skeletonWrap: {
    gap: theme.spacing.sm,
  },
  skeletonCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.spacing.md,
  },
  skeletonAvatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.goldSoft,
  },
  skeletonLines: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  skeletonLine: {
    height: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.goldSoft,
    width: "64%",
  },
  skeletonLineWide: {
    width: "88%",
  },
  skeletonLineShort: {
    width: "42%",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxxl,
  },
  stateTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    textAlign: "center",
  },
  stateCopy: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
});
