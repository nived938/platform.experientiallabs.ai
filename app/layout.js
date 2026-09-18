import "./globals.css";

export const metadata={
  title:"Experiential AI Chat",
  description:"A modern AI chat app powered by Experiential Labs"
};

export default function RootLayout({children}){
  return <html lang="en"><body>{children}</body></html>;
}
