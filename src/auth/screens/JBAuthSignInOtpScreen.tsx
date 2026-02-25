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
    resetPhoneStep: () => {},
    canSubmit: false,
    isLoading: false,
    submitLabel: "Solicitar código OTP",
    otpRequested: false,
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
      otpRequested,
      resetPhoneStep,
    }: {
      submit: () => void;
      canSubmit: boolean;
      isLoading: boolean;
      submitLabel: string;
      otpRequested: boolean;
      resetPhoneStep: () => void;
    }) => {
      setFormState((prev) =>
        prev.submit === submit &&
        prev.resetPhoneStep === resetPhoneStep &&
        prev.canSubmit === canSubmit &&
        prev.isLoading === isLoading &&
        prev.submitLabel === submitLabel &&
        prev.otpRequested === otpRequested
          ? prev
          : { submit, resetPhoneStep, canSubmit, isLoading, submitLabel, otpRequested }
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
            iconPosition="start"
            text={formState.submitLabel}
            loading={formState.isLoading}
            isDisabled={!formState.canSubmit}
            onPress={formState.submit}
          />
          {formState.otpRequested ? (
            <JBFormButton
              variant="link"
              action="primary"
              size="sm"
              className="self-center px-0"
              text="Cambiar número"
              textClassName="text-sm font-medium text-primary-600 dark:text-primary-300"
              onPress={formState.resetPhoneStep}
            />
          ) : null}
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
