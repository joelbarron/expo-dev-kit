import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { CustomFormInput as JBFormInput } from "./JBFormInput";
import { getColor } from "../utils";

const getDjangoLikePasswordError = (password: string): string | null => {
  if (!password) {
    return "Debes ingresar tu contraseña.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }
  return null;
};

type JBFormPasswordInputProps = Omit<
  Parameters<typeof JBFormInput>[0],
  "type" | "secureTextEntry" | "slotAfter"
> & {
  enforceDjangoLikeValidation?: boolean;
  hideToggleWhenDisabled?: boolean;
};

const composeValidate = (baseValidate: any, enforceDjangoLikeValidation: boolean) => {
  const passwordRule = (value: string) => {
    if (!enforceDjangoLikeValidation) return true;
    return getDjangoLikePasswordError(value) ?? true;
  };

  if (!baseValidate) {
    return passwordRule;
  }

  if (typeof baseValidate === "function") {
    return (value: string) => {
      const base = baseValidate(value);
      if (base !== true) return base;
      return passwordRule(value);
    };
  }

  if (typeof baseValidate === "object") {
    return {
      ...baseValidate,
      djangoLikePassword: passwordRule,
    };
  }

  return passwordRule;
};

export function JBFormPasswordInput(props: JBFormPasswordInputProps) {
  const {
    rules,
    isDisabled = false,
    enforceDjangoLikeValidation = false,
    hideToggleWhenDisabled = true,
    ...rest
  } = props as any;

  const [showPassword, setShowPassword] = useState(false);
  const primaryColor = getColor("primary") ?? {};

  const mergedRules = useMemo(
    () => ({
      ...(rules ?? {}),
      validate: composeValidate(rules?.validate, enforceDjangoLikeValidation),
    }),
    [rules, enforceDjangoLikeValidation],
  );

  const canToggle = !(hideToggleWhenDisabled && isDisabled);

  return (
    <JBFormInput
      {...rest}
      rules={mergedRules}
      type={showPassword ? "text" : "password"}
      secureTextEntry={!showPassword}
      isDisabled={isDisabled}
      slotAfter={
        canToggle ? (
          <Pressable
            onPress={() => setShowPassword((value: boolean) => !value)}
            disabled={isDisabled}
            style={styles.passwordToggle}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={20}
              color={primaryColor[500] ?? "#2563eb"}
            />
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  passwordToggle: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginRight: 4,
  },
});
