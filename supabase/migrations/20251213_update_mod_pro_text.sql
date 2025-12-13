-- Update mod_pro to include the specific keyword for testing
UPDATE public.prompt_modules
SET content = '作成された議事録や契約書に対して、社会福祉法および関連通知に基づく法的チェックを行います。リスクがある条項や、記載漏れの可能性がある項目については、具体的に指摘し、修正案を提示してください。また、複雑な案件については「司法書士レベルの判断」を提供し、専門的な見地から助言を行ってください。'
WHERE slug = 'mod_pro';
