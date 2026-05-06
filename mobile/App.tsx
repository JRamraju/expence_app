import { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView, View } from "react-native";
import { Button, Card, Provider as PaperProvider, Text, TextInput } from "react-native-paper";
import { MobileEntry } from "src/features/MobileEntry";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("app_pin").then(setStoredPin);
  }, []);

  const unlockWithBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Expense App",
      fallbackLabel: "Use device PIN/pattern"
    });
    if (result.success) {
      setUnlocked(true);
      await SecureStore.setItemAsync("session", "active");
    }
  };

  const submitPin = async () => {
    if (!storedPin) {
      await SecureStore.setItemAsync("app_pin", pin);
      setUnlocked(true);
      return;
    }
    if (storedPin === pin) setUnlocked(true);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f9ff" }}>
        {!unlocked ? (
          <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <Card><Card.Content>
              <Text variant="titleLarge">Secure Unlock</Text>
              <Button mode="contained" onPress={unlockWithBiometric} style={{ marginVertical: 12 }}>Fingerprint / Device Auth</Button>
              <TextInput label={storedPin ? "Enter App PIN" : "Set App PIN"} value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" />
              <Button mode="outlined" onPress={submitPin} style={{ marginTop: 10 }}>{storedPin ? "Unlock with PIN" : "Save PIN & Continue"}</Button>
            </Card.Content></Card>
          </View>
        ) : (
          <MobileEntry />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}
