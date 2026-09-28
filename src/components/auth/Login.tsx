"use client";
import React, { useEffect, useState } from "react";
import Logo from "../common/Logo";
import Input from "../common/Input";
import Button from "../common/Button";
import { LoginFormConstants } from "@/constants/loginForm";
import { POST_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { showToast } from "../common/Toast";

const Login = () => {
  const [loginFormData, setloginFormData] = useState<any>({});
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Submitting before hydration fell through to the browser's native form submit - a GET
  // that put the password in the URL (history, server logs). Button stays disabled until
  // React owns the form, and method="post" keeps it out of the URL regardless.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const handleChange = (key: string, value: any) => {
    setloginFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    const { username, password } = loginFormData;
    if (!username || !password) return showToast({ message: "Please enter both username and password", type: "error" });

    let payload = { username, password };

    setLoading(true);
    POST_API(endpoints.auth.login, payload)
      .then((res: any) => {
        const jwt = res?.data?.jwt;
        if (res?.status !== 200 || !jwt) {
          setLoading(false);
          return showToast({ message: "Login failed - unexpected server response", type: "error" });
        }
        Cookies.set("token", jwt, {
          expires: 1,
          path: "/",
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        });
        setloginFormData({});
        router.replace("/volunteer");
      })
      .catch((err) => {
        const errorMessage = err?.status === 401 ? "Invalid username or password" : "Something went wrong";
        showToast({ message: errorMessage, type: "error" });
        setLoading(false);
      });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col w-full max-w-[482px] mx-4 min-h-[462px] bg-white p-6 sm:p-10 rounded-[40px] gap-7">
        <Logo className="flex-col" />
        {/* A real <form> so Enter in either field submits (previously only a mouse
            click on the button did anything). */}
        <form className="flex flex-col gap-6" method="post" onSubmit={handleFormSubmit} noValidate>
          <h4 className="text-center text-xl font-medium text-black">
            Admin Portal
          </h4>
          {LoginFormConstants.map((input: FormField) => (
            <Input
              key={input.name}
              {...input}
              onChange={(value: string) => handleChange(input.name, value)}
            />
          ))}
          <Button
            loading={loading}
            customClassName="h-[40px] !border-none !text-white"
            btnVariant="secondary"
            title={"Login"}
            htmlType="submit"
            disabled={!hydrated}
          />
        </form>
      </div>
    </div>
  );
};

export default Login;
