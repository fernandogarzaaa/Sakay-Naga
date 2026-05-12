import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, api } from "../api/client";
import type { User } from "../api/types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";

type Mode = "login" | "register";

type Props = {
  user: User | null;
  onUserChanged: (user: User | null) => void;
};

export function AccountScreen({ user, onUserChanged }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ title: string; body: string; tone: "info" | "warning" | "danger" } | null>(null);

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      setMessage({ title: "Missing details", body: "Use a valid email and an 8+ character password.", tone: "warning" });
      return;
    }
    if (mode === "register" && !name.trim()) {
      setMessage({ title: "Name required", body: "Add your name before creating an account.", tone: "warning" });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const nextUser =
        mode === "register"
          ? await api.register({ name, email, password })
          : await api.login({ email, password });
      onUserChanged(nextUser);
      setMessage({ title: "Signed in", body: `Welcome, ${nextUser.name || nextUser.email}.`, tone: "info" });
    } catch (error) {
      setMessage({
        title: "Sign-in failed",
        body: error instanceof ApiError || error instanceof Error ? error.message : "Unable to authenticate.",
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await api.logout();
    } finally {
      onUserChanged(null);
      setBusy(false);
    }
  };

  return (
    <Screen title="Account" subtitle="Use a first-party Sakay Naga account. No external provider is required.">
      {message ? <Notice title={message.title} body={message.body} tone={message.tone} /> : null}

      {user ? (
        <Card>
          <Text style={styles.name}>{user.name || user.email}</Text>
          <Text style={styles.muted}>{user.email}</Text>
          <Text style={styles.role}>{user.role}</Text>
          <View style={styles.action}>
            <Button variant="danger" disabled={busy} onPress={logout}>
              Sign out
            </Button>
          </View>
        </Card>
      ) : (
        <>
          <Card>
            {mode === "register" ? (
              <Field label="Name" value={name} onChangeText={setName} placeholder="Juan Dela Cruz" />
            ) : null}
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
            />
          </Card>
          <Button disabled={busy} onPress={submit}>
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <View style={styles.switch}>
            <Button variant="secondary" disabled={busy} onPress={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create account" : "I already have an account"}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  role: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    borderRadius: 999,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  action: {
    marginTop: 18,
  },
  switch: {
    marginTop: 10,
  },
});
