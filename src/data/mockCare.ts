export type TaskStatus = "confirmed" | "not-confirmed" | "skipped";

export type CareTask = {
  id: string;
  title: string;
  detail: string;
  time: string;
  status: TaskStatus;
  icon: "sunny-outline" | "water-outline" | "walk-outline" | "chatbubble-ellipses-outline";
  tone: "blue" | "orange" | "green" | "purple";
};

export type CareRecipient = {
  id: string;
  name: string;
  relationship: string;
  initials: string;
  tasks: CareTask[];
};

export const mockRecipients: CareRecipient[] = [
  {
    id: "margaret",
    name: "Margaret",
    relationship: "Mum",
    initials: "M",
    tasks: [
      {
        id: "morning-check-in",
        title: "Morning check-in",
        detail: "A quick hello to start the day",
        time: "8:00 AM",
        status: "confirmed",
        icon: "sunny-outline",
        tone: "blue",
      },
      {
        id: "water-break",
        title: "Water break",
        detail: "Ask if Margaret has had a drink",
        time: "10:30 AM",
        status: "not-confirmed",
        icon: "water-outline",
        tone: "orange",
      },
      {
        id: "fresh-air",
        title: "Fresh air",
        detail: "A gentle walk or time by the window",
        time: "2:00 PM",
        status: "not-confirmed",
        icon: "walk-outline",
        tone: "green",
      },
      {
        id: "evening-note",
        title: "Evening note",
        detail: "Share one good thing from today",
        time: "7:00 PM",
        status: "not-confirmed",
        icon: "chatbubble-ellipses-outline",
        tone: "purple",
      },
    ],
  },
  {
    id: "daniel",
    name: "Daniel",
    relationship: "Dad",
    initials: "D",
    tasks: [
      {
        id: "daniel-check-in",
        title: "Morning check-in",
        detail: "Send a quick hello",
        time: "9:00 AM",
        status: "confirmed",
        icon: "sunny-outline",
        tone: "blue",
      },
      {
        id: "daniel-note",
        title: "Evening note",
        detail: "Share a moment from your day",
        time: "7:00 PM",
        status: "not-confirmed",
        icon: "chatbubble-ellipses-outline",
        tone: "purple",
      },
    ],
  },
];
