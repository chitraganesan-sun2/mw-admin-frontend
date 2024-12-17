import React from "react";
import Logo from "../common/Logo";

const Login = () => {
  return (
    <div className="flex flex-col gap-4 bg-background">
      <Logo className="flex-col" />
      <h1 className="text-2xl font-bold">Login</h1>
    </div>
  );
};

export default Login;
