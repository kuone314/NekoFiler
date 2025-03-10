use std::borrow::Cow;
use std::cmp::Ordering;

extern crate regex;
use itertools::Itertools;
use regex::Regex;

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub enum FilterType {
  StrMatch,
  RegExpr,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct FilterInfo {
  filter_type: FilterType,
  matcher_str: String,
}

impl FilterInfo {
  pub(crate) fn new() -> Self {
    Self {
      filter_type: FilterType::StrMatch,
      matcher_str: "".to_string(),
    }
  }
}

type MatchResult = Option<Vec<usize>>;
impl FilterInfo {
  pub(crate) fn is_match(
    &self,
    target: &String,
  ) -> MatchResult {
    if self.matcher_str.is_empty() {
      return Some(Vec::new());
    }

    let exist_upper_case = self.matcher_str.chars().any(|c| c.is_uppercase());

    let matcher_str = if !exist_upper_case {
      Cow::Owned(self.matcher_str.to_lowercase())
    } else {
      Cow::Borrowed(&self.matcher_str)
    };

    let target = if !exist_upper_case {
      Cow::Owned(target.to_lowercase())
    } else {
      Cow::Borrowed(target)
    };

    match self.filter_type {
      FilterType::StrMatch => str_match(&matcher_str, &target),
      FilterType::RegExpr => reg_expr_match(&matcher_str, &target),
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

fn str_match(
  matcher_str: &String,
  target: &String,
) -> MatchResult {
  let mut matched_idx_list: Vec<usize> = Vec::new();

  let mut matcher_str_part = matcher_str.clone();
  let mut target_part = target.clone();

  while matcher_str_part.len() != 0 {
    let Some(StrMatchPartResult {
      match_start_idx,
      matching_length,
    }) = str_match_part(&matcher_str_part, &target_part)
    else {
      return None;
    };

    let diff = target.len() - target_part.len();
    let part_matched_range = match_start_idx..match_start_idx + matching_length;
    let matched_range = part_matched_range.map(|idx| idx + diff);
    matched_idx_list.append(&mut matched_range.collect_vec());
    matcher_str_part = matcher_str_part.chars().skip(matching_length).collect();
    target_part = target_part
      .chars()
      .skip(match_start_idx + matching_length)
      .collect();
  }

  Some(matched_idx_list)
}

struct StrMatchPartResult {
  match_start_idx: usize,
  matching_length: usize,
}
fn str_match_part(
  matcher_str: &String,
  target: &String,
) -> Option<StrMatchPartResult> {
  (1..=matcher_str.len()).rev().find_map(|matching_length| {
    let part_matcher_str = matcher_str
      .chars()
      .take(matching_length)
      .collect::<String>();

    target
      .find(&part_matcher_str)
      .map(|match_start_idx| StrMatchPartResult {
        match_start_idx,
        matching_length,
      })
  })
}

///////////////////////////////////////////////////////////////////////////////////////////////////

fn reg_expr_match(
  matcher_str: &String,
  target: &String,
) -> MatchResult {
  let Ok(reg_exp) = Regex::new(matcher_str.as_str()) else {
    return None;
  };

  let Some(res) = reg_exp.find(target.as_str()) else {
    return None;
  };
  Some((res.0..res.1).collect::<Vec<usize>>())
}

///////////////////////////////////////////////////////////////////////////////////////////////////

#[derive(Debug, PartialEq, Eq)]
struct ClusterInfo {
  length: usize,
  start_idx: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) struct MatchingRate {
  result: Vec<ClusterInfo>,
}

impl MatchingRate {
  fn no_match() -> MatchingRate {
    MatchingRate { result: Vec::new() }
  }
}

impl Ord for MatchingRate {
  fn cmp(
    &self,
    other: &Self,
  ) -> std::cmp::Ordering {
    let result = self
      .result
      .iter()
      .map(|item| item.length)
      .cmp(other.result.iter().map(|item| item.length));
    if result != Ordering::Equal {
      return result;
    }

    other
      .result
      .iter()
      .map(|item| item.start_idx)
      .cmp(self.result.iter().map(|item| item.start_idx))
  }
}

impl PartialOrd for MatchingRate {
  fn partial_cmp(
    &self,
    other: &Self,
  ) -> Option<Ordering> {
    Some(self.cmp(other))
  }
}

pub(crate) fn matching_rate(matched_idx_list: &MatchResult) -> MatchingRate {
  let Some(matched_idx_list) = matched_idx_list else {
    return MatchingRate::no_match();
  };

  if matched_idx_list.len() == 0 {
    return MatchingRate::no_match();
  }

  let mut cluster_length_list = Vec::new();
  let mut cluster_start_idx_list = vec![matched_idx_list[0]];

  let mut continuous_count = 1;
  for list_idx in 0..matched_idx_list.len() - 1 {
    let match_idx = matched_idx_list[list_idx];
    let next_match_idx = matched_idx_list[list_idx + 1];
    let is_continuous = (next_match_idx - match_idx) == 1;
    if is_continuous {
      continuous_count = continuous_count + 1;
    } else {
      cluster_length_list.push(continuous_count);
      cluster_start_idx_list.push(next_match_idx);
    }
  }
  cluster_length_list.push(continuous_count);

  return MatchingRate {
    result: cluster_length_list
      .into_iter()
      .zip(cluster_start_idx_list)
      .map(|(length, start_idx)| ClusterInfo { length, start_idx })
      .collect_vec(),
  };
}
