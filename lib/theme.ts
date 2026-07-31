export const THEME_STORAGE_KEY = "furbo-theme";

// Script anti-flash embebido en app/layout.tsx: aplica el tema guardado
// ANTES del primer pintado para no ver un parpadeo oscuro→claro.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
