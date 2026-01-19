
-- Update jobs to replace old Nadia ID with new Nadia ID in team_member_ids array
UPDATE jobs
SET team_member_ids = array_replace(team_member_ids, '9e069429-eaa5-46de-8d0c-c7a597d50cb3'::uuid, '47a5aa3f-f14c-4caf-9ea0-387e371c119a'::uuid)
WHERE '9e069429-eaa5-46de-8d0c-c7a597d50cb3'::uuid = ANY(team_member_ids);

-- Update job_expenses to point to new Nadia ID
UPDATE job_expenses
SET team_member_id = '47a5aa3f-f14c-4caf-9ea0-387e371c119a'::uuid
WHERE team_member_id = '9e069429-eaa5-46de-8d0c-c7a597d50cb3'::uuid;
