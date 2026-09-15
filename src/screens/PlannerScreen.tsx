import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Outfit } from "../models";
import { AppData } from "../storage";
import { makePackingList, plannerId } from "../services/planner";
import { Button, Chips, Field, Note, Page, s, Title } from "../components/ui";
import { money } from "../engine";

const today = () => new Date().toISOString().slice(0, 10);

export function PlannerScreen({
  data,
  persist,
  onClose,
}: {
  data: AppData;
  persist: (next: AppData) => Promise<void>;
  onClose: () => void;
}) {
  const outfits = useMemo(
    () =>
      [...data.saved, ...data.recent].filter(
        (outfit, index, all) =>
          all.findIndex((x) => x.id === outfit.id) === index,
      ),
    [data.recent, data.saved],
  );
  const [selectedId, setSelectedId] = useState(outfits[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [tripName, setTripName] = useState("");
  const [message, setMessage] = useState("");
  const selected = outfits.find((outfit) => outfit.id === selectedId);
  const outfitLabel = (outfit: Outfit) =>
    `${outfit.name} · ${money(outfit.totalPrice)} · ${outfit.createdAt.slice(0, 10)}`;
  const schedule = async () => {
    if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today()) {
      setMessage("Choose a saved outfit and a valid date today or later.");
      return;
    }
    await persist({
      ...data,
      planned: [
        ...data.planned,
        {
          id: plannerId("plan"),
          outfitId: selected.id,
          date,
          note: note.trim(),
          reminderTime: null,
        },
      ],
    });
    setMessage(
      "Added to your local outfit calendar. Reminders need notification permission and a production notification service.",
    );
  };
  const packing = async () => {
    if (!selected) {
      setMessage("Save or build an outfit before making a packing list.");
      return;
    }
    await persist({
      ...data,
      packingLists: [
        ...data.packingLists,
        makePackingList(tripName, date, date, [selected]),
      ],
    });
    setMessage("Packing list created from the chosen outfit.");
  };
  return (
    <Page inset>
      <Button secondary title="← Back" onPress={onClose} />
      <Title
        eyebrow="PLAN AHEAD"
        title="Your outfit calendar."
        body="Plan a look, make a packing list and keep the details on this device."
      />
      {outfits.length ? (
        <>
          <Text style={s.label}>Choose an outfit</Text>
          <Chips
            options={outfits.map(outfitLabel)}
            values={selected ? [outfitLabel(selected)] : []}
            onChange={(name) =>
              setSelectedId(
                outfits.find((outfit) => outfitLabel(outfit) === name)?.id ??
                  "",
              )
            }
          />
          <Field
            label="Date (YYYY-MM-DD)"
            value={date}
            onChange={setDate}
            placeholder="2026-09-20"
          />
          <Field
            label="Plan note (optional)"
            value={note}
            onChange={setNote}
            placeholder="Dinner reservation at 7"
          />
          <Button title="Add to calendar" onPress={schedule} />
          <Field
            label="Trip name (optional)"
            value={tripName}
            onChange={setTripName}
            placeholder="Weekend away"
          />
          <Button secondary title="Make packing list" onPress={packing} />
        </>
      ) : (
        <Note text="Build and save an outfit first, then you can schedule it here." />
      )}
      <Text style={s.h2}>Upcoming</Text>
      {data.planned.length ? (
        data.planned.map((plan) => {
          const outfit = outfits.find((item) => item.id === plan.outfitId);
          return (
            <View key={plan.id} style={s.card}>
              <Text style={s.h2}>{outfit?.name ?? "Saved outfit"}</Text>
              <Text style={s.body}>
                {plan.date}
                {plan.note ? ` · ${plan.note}` : ""}
              </Text>
              <Button
                secondary
                title="Remove plan"
                onPress={() =>
                  persist({
                    ...data,
                    planned: data.planned.filter((item) => item.id !== plan.id),
                  })
                }
              />
            </View>
          );
        })
      ) : (
        <Text style={s.body}>Nothing scheduled yet.</Text>
      )}
      <Text style={s.h2}>Packing lists</Text>
      {data.packingLists.map((list) => (
        <View key={list.id} style={s.card}>
          <Text style={s.h2}>{list.tripName}</Text>
          {list.items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.packed }}
              onPress={() =>
                persist({
                  ...data,
                  packingLists: data.packingLists.map((current) =>
                    current.id !== list.id
                      ? current
                      : {
                          ...current,
                          items: current.items.map((candidate) =>
                            candidate.id === item.id
                              ? { ...candidate, packed: !candidate.packed }
                              : candidate,
                          ),
                        },
                  ),
                })
              }
            >
              <Text style={s.body}>
                {item.packed ? "✓" : "○"} {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      {!!message && <Note text={message} />}
      <Note text="Group planning, price-drop/restock alerts, virtual try-on, screenshot analysis, voice input and secure accounts need a connected server or approved device capability. They remain unavailable until those integrations are configured, rather than generating false results." />
    </Page>
  );
}
