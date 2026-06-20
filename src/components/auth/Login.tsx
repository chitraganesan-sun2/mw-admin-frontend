"use client";
import React, { useState } from "react";
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

  const handleChange = (key: string, value: any) => {
    setloginFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = () => {
    const { username, password } = loginFormData;
    if (!username || !password) return showToast({ message: "Please enter both username and password", type: "error" });

    let payload = { username, password };

    setLoading(true);
    POST_API(endpoints.auth.login, payload)
      .then((res) => {
        Cookies.set("token", res?.data?.jwt, { expires: 1, path: "/" });
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
      <div className="flex flex-col min-w-[482px] min-h-[462px] bg-white p-10 rounded-[40px] gap-7">
        <Logo className="flex-col" />
        <div className="flex flex-col gap-6">
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
            onClick={handleFormSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
