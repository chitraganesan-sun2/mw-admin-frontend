// "How did you hear about us?" answer from onboarding (consent_and_permissions), as one line.
// Older applications don't have it.
export const formatHeardAboutUs = (consent?: { heard_about_us?: string | null; heard_about_us_other?: string | null } | null) => {
  const answer = consent?.heard_about_us;
  if (!answer) return "-";
  const other = consent?.heard_about_us_other?.trim();
  return answer === "Other" && other ? `Other: ${other}` : answer;
};
