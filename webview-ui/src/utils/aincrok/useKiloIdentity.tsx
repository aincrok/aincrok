import { useEffect, useState } from "react"
import { ProfileDataResponsePayload } from "@roo/WebviewMessage"
import { vscode } from "@/utils/vscode"

export function useKiloIdentity(aincrokToken: string, machineId: string) {
	const [kiloIdentity, setKiloIdentity] = useState("")
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === "profileDataResponse") {
				const payload = event.data.payload as ProfileDataResponsePayload | undefined
				const success = payload?.success || false
				const tokenFromMessage = payload?.data?.aincrokToken || ""
				const email = payload?.data?.user?.email || ""
				if (!success) {
					console.error("KILOTEL: Failed to identify Kilo user, message doesn't indicate success:", payload)
				} else if (tokenFromMessage !== aincrokToken) {
					console.error("KILOTEL: Failed to identify Kilo user, token mismatch:", payload)
				} else if (!email) {
					console.error("KILOTEL: Failed to identify Kilo user, email missing:", payload)
				} else {
					console.debug("KILOTEL: Kilo user identified:", email)
					setKiloIdentity(email)
					window.removeEventListener("message", handleMessage)
				}
			}
		}

		if (aincrokToken) {
			console.debug("KILOTEL: fetching profile...")
			window.addEventListener("message", handleMessage)
			vscode.postMessage({
				type: "fetchProfileDataRequest",
			})
		} else {
			console.debug("KILOTEL: no Kilo user")
			setKiloIdentity("")
		}

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [aincrokToken])
	return kiloIdentity || machineId
}
