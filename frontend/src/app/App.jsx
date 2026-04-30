import { RouterProvider } from "react-router";
import { router } from "./routes.js";
function App() {
  return <RouterProvider router={router} />;
}
export {
  App as default
};
