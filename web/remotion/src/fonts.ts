import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";

const fr = loadFraunces("normal", { weights: ["600", "700", "900"], subsets: ["latin"] });
const ar = loadArchivo("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const fontDisplay = fr.fontFamily;
export const fontBody = ar.fontFamily;
