
use std::borrow::Cow;

extern crate regex;
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

fn str_match(
  matcher_str: &String,
  target: &String,
) -> MatchResult {
  let mut matched_idx_list: Vec<usize> = Vec::new();

  for str_char in matcher_str.chars() {
    let prev_match_idx = matched_idx_list.last().copied();
    let search_start_idx = prev_match_idx.map_or(0, |idx| idx + 1);
    let search_str = &target[search_start_idx..];

    if let Some(found_idx) = search_str.find(str_char) {
      matched_idx_list.push(search_start_idx + found_idx);
    } else {
      return None;
    }
  }

  Some(matched_idx_list)
}

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