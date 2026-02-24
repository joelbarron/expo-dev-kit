import { useCallback, useState } from "react";

import { JBFormButton } from "../../forms";
import { VStack } from "../../ui";
import { JBAuthOtpSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { AuthScreenLayout } from "../ui";
import { JBAuthNavigator } from "./types";

export type JBAuthSignInOtpScreenProps = {
  navigator: JBAuthNavigator;
};

export function JBAuthSignInOtpScreen(props: JBAuthSignInOtpScreenProps) {
  const { navigator } = props;
  const auth = useJBAuth();
  const [formState, setFormState] = useState({
    submit: () => {},
    canSubmit: false,
    isLoading: false,
    submitLabel: "Solicitar código OTP",
  });

  const handleOtpRequest = useCallback(
    (values: { phone: string }) => auth.requestOtp({ phone: values.phone, channel: "sms" }),
    [auth]
  );
  const handleOtpVerify = useCallback(
    async (values: { phone: string; code: string; role?: string }) => {
      await auth.signInOtp({
        phone: values.phone,
        code: values.code,
        channel: "sms",
        role: values.role,
        client: "mobile",
      });
      navigator.onSignedIn?.();
    },
    [auth, navigator]
  );

  const onOtpFormStateChange = useCallback(
    ({
      submit,
      canSubmit,
      isLoading,
      submitLabel,
    }: {
      submit: () => void;
      canSubmit: boolean;
      isLoading: boolean;
      submitLabel: string;
    }) => {
      setFormState((prev) =>
        prev.submit === submit &&
        prev.canSubmit === canSubmit &&
        prev.isLoading === isLoading &&
        prev.submitLabel === submitLabel
          ? prev
          : { submit, canSubmit, isLoading, submitLabel }
      );
    },
    []
  );

  return (
    <AuthScreenLayout
      footerAdjustableHeight
      footerClassName="pt-4 pb-6"
      footer={
        <VStack space="md" className="pt-6">
          <JBFormButton
            variant="solid"
            size="xl"
            className="px-4"
            buttonType="default"
            showIcon
            iconName="message-processing-outline"
            text={formState.submitLabel}
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          {/* <JBFormButton
            variant="link"
            action="primary"
            size="sm"
            className="self-center px-0"
            text="Continuar con usuario y contraseña"
            textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
            onPress={navigator.goToSignInPassword ?? (() => navigator.goToSignIn({ initialMode: "password" }))}
          /> */}
        </VStack>
      }
    >
      <JBAuthOtpSignInForm
        showSubmitButton={false}
        onFormStateChange={onOtpFormStateChange}
        onRequestOtp={handleOtpRequest}
        onVerifyOtp={handleOtpVerify}
      />
    </AuthScreenLayout>
  );
}
