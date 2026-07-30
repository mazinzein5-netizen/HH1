import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  callPhoneNumber,
  findNearbyPharmacies,
  geocodePlace,
  NearbyPharmacy,
} from "@/utils/pharmacyShare";

type FinderState = "idle" | "locating" | "searching" | "ready" | "denied" | "error";

export default function PharmaciesScreen() {
  const colors = useColors();

  const [state, setState] = useState<FinderState>("idle");
  const [pharmacies, setPharmacies] = useState<NearbyPharmacy[]>([]);
  const [areaLabel, setAreaLabel] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchAround = useCallback(async (lat: number, lon: number, label: string | null) => {
    setState("searching");
    setErrorMsg(null);
    try {
      const results = await findNearbyPharmacies(lat, lon);
      setPharmacies(results);
      setAreaLabel(label);
      setState("ready");
    } catch {
      setErrorMsg("Could not load pharmacies. Please check your connection and try again.");
      setState("error");
    }
  }, []);

  const useMyLocation = useCallback(async () => {
    setState("locating");
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await searchAround(pos.coords.latitude, pos.coords.longitude, "near you");
    } catch {
      setErrorMsg("Could not determine your location. Try searching by town or Eircode instead.");
      setState("error");
    }
  }, [searchAround]);

  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);

  async function handleManualSearch() {
    const q = manualQuery.trim();
    if (!q) return;
    Haptics.selectionAsync();
    setState("searching");
    setErrorMsg(null);
    try {
      const place = await geocodePlace(q);
      if (!place) {
        setErrorMsg(`No results for "${q}". Try a town name or Eircode.`);
        setState("error");
        return;
      }
      await searchAround(place.lat, place.lon, place.label.split(",")[0]);
    } catch {
      setErrorMsg("Area search failed. Please check your connection and try again.");
      setState("error");
    }
  }

  function openStatus(p: NearbyPharmacy): { label: string; color: string } {
    if (p.openNow === true) return { label: "Open now", color: "#22c55e" };
    if (p.openNow === false) return { label: "Closed", color: "#e5484d" };
    return { label: p.openingHours ? "Hours listed" : "Hours unknown", color: colors.mutedForeground };
  }

  const loading = state === "locating" || state === "searching";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search controls */}
        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.searchRow}>
            <TextInput
              value={manualQuery}
              onChangeText={setManualQuery}
              onSubmitEditing={handleManualSearch}
              placeholder="Search town or Eircode…"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              autoCorrect={false}
              style={[styles.searchInput, {
                color: colors.foreground,
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
                fontFamily: "Inter_400Regular",
              }]}
            />
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.glassPrimary, borderColor: colors.glassPrimaryBorder }]}
              onPress={handleManualSearch}
              activeOpacity={0.85}
            >
              <Feather name="search" size={17} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.locBtn} onPress={useMyLocation} activeOpacity={0.8}>
            <MaterialCommunityIcons name="crosshairs-gps" size={15} color={colors.gold} />
            <Text style={[styles.locBtnText, { color: colors.goldLight, fontFamily: "Inter_600SemiBold" }]}>
              Use my location
            </Text>
          </TouchableOpacity>
          <Text style={[styles.disclosureText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            To run the search, your coordinates or search text are sent only to the OpenStreetMap lookup service — never to HIVE servers, and never stored.
          </Text>
        </View>

        {/* Status / errors */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={[styles.centerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {state === "locating" ? "Getting your location…" : "Finding pharmacies…"}
            </Text>
          </View>
        )}

        {state === "denied" && (
          <View style={[styles.noticeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="map-marker-off" size={26} color={colors.mutedForeground} />
            <Text style={[styles.noticeTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Location permission not granted
            </Text>
            <Text style={[styles.noticeBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No problem — search for pharmacies by town or Eircode above instead.
            </Text>
          </View>
        )}

        {state === "error" && errorMsg && (
          <View style={[styles.noticeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={26} color={colors.accent} />
            <Text style={[styles.noticeBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {errorMsg}
            </Text>
          </View>
        )}

        {/* Results */}
        {state === "ready" && (
          <>
            <Text style={[styles.resultsHeader, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {pharmacies.length
                ? `${pharmacies.length} pharmacies ${areaLabel ? `· ${areaLabel}` : ""}`
                : "No pharmacies found in this area. Try a different search."}
            </Text>

            {pharmacies.map((p) => {
              const status = openStatus(p);
              return (
                <View key={p.id} style={[styles.pharmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.pharmIcon, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.28)" }]}>
                    <MaterialCommunityIcons name="mortar-pestle-plus" size={20} color="#22c55e" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.pharmName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.pharmMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                      {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`}
                      {p.address ? ` · ${p.address}` : ""}
                    </Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color, fontFamily: "Inter_600SemiBold" }]}>
                        {status.label}
                      </Text>
                      {p.openingHours && p.openNow === undefined && (
                        <Text style={[styles.hoursText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                          {p.openingHours}
                        </Text>
                      )}
                    </View>
                  </View>
                  {p.phone ? (
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.4)" }]}
                      activeOpacity={0.85}
                      onPress={() => { Haptics.selectionAsync(); callPhoneNumber(p.phone!); }}
                    >
                      <MaterialCommunityIcons name="phone" size={17} color="#22c55e" />
                      <Text style={[styles.callBtnText, { color: "#22c55e", fontFamily: "Inter_700Bold" }]}>Call</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.callBtn, { borderColor: colors.border, opacity: 0.5 }]}>
                      <MaterialCommunityIcons name="phone-off" size={16} color={colors.mutedForeground} />
                    </View>
                  )}
                </View>
              );
            })}

            {pharmacies.length > 0 && (
              <Text style={[styles.dataNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Pharmacy details from OpenStreetMap. Opening status is a best-effort guide — call ahead to confirm.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  searchCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  searchRow: { flexDirection: "row", gap: 10 },
  searchInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  searchBtn: { width: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  locBtn: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingVertical: 2 },
  locBtnText: { fontSize: 13 },
  disclosureText: { fontSize: 10.5, lineHeight: 15 },

  centerBox: { alignItems: "center", gap: 12, paddingVertical: 40 },
  centerText: { fontSize: 13 },

  noticeBox: { alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 20 },
  noticeTitle: { fontSize: 14.5 },
  noticeBody: { fontSize: 12.5, lineHeight: 19, textAlign: "center" },

  resultsHeader: { fontSize: 12, letterSpacing: 0.4, marginTop: 2 },

  pharmCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  pharmIcon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pharmName: { fontSize: 14.5 },
  pharmMeta: { fontSize: 11.5 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5 },
  hoursText: { fontSize: 10.5, flex: 1 },

  callBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  callBtnText: { fontSize: 13 },

  dataNote: { fontSize: 10.5, lineHeight: 16, textAlign: "center", marginTop: 4 },
});
